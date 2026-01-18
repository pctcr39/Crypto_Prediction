import asyncio
import json
import logging
import random
import websockets
from typing import Optional, Dict, Any
from dataclasses import dataclass
import time

# Configure logging
logging.basicConfig(
    format='%(asctime)s [%(levelname)s] %(message)s',
    level=logging.INFO
)
logger = logging.getLogger("MarketConsumer")

MAX_QUEUE_SIZE = 1000

@dataclass
class MarketTick:
    symbol: str
    price: float
    quantity: float
    event_time: int
    received_time: float

class ConflatedQueue:
    """
    A smart queue that safeguards against backpressure.
    If the queue exceeds capacity, it drops the OLDEST items to make room for the NEWEST.
    This ensures the consumer is always working towards the 'Live Edge' of the market.
    """
    def __init__(self, max_size: int = 1000):
        self._queue = asyncio.Queue(maxsize=max_size)
    
    async def put(self, item: Any):
        if self._queue.full():
            try:
                # Discard the oldest item (Backpressure Relief)
                dropped = self._queue.get_nowait()
                # Determine lag
                if isinstance(dropped, MarketTick):
                    lag = time.time() - dropped.received_time
                    logger.warning(f"⚠️ Conflation Triggered: Dropping old tick. Lag: {lag*1000:.2f}ms. Queue Full.")
            except asyncio.QueueEmpty:
                pass
        
        await self._queue.put(item)

    async def get(self):
        return await self._queue.get()

    def qsize(self):
        return self._queue.qsize()

class MarketDataConsumer:
    def __init__(self, symbol: str, ws_url: str):
        self.symbol = symbol.lower()
        self.ws_url = ws_url
        self.queue = ConflatedQueue(max_size=MAX_QUEUE_SIZE)
        self.running = False
        
        # Redis connection placeholder (if needed for downstream publishing)
        # self.redis = redis.Redis(...)

    async def connect_and_produce(self):
        """
        Producer Coroutine:
        Connects to Binance WS, continuously reads messages, and pushes to internal Queue.
        Handles Reconnection with Exponential Backoff.
        """
        backoff_delay = 1
        max_backoff = 30

        while self.running:
            try:
                logger.info(f"Connecting to {self.ws_url}...")
                async with websockets.connect(self.ws_url) as ws:
                    logger.info("✅ WebSocket Connected.")
                    backoff_delay = 1 # Reset backoff on success

                    async for message in ws:
                        if not self.running: 
                            break
                        
                        try:
                            data = json.loads(message)
                            # Binance Trade Stream Format Check
                            if 'p' in data:
                                tick = MarketTick(
                                    symbol=data['s'],
                                    price=float(data['p']),
                                    quantity=float(data['q']),
                                    event_time=data['E'],
                                    received_time=time.time()
                                )
                                await self.queue.put(tick)
                        except Exception as e:
                            logger.error(f"Parse error: {e}")
                            
            except (websockets.ConnectionClosed, OSError) as e:
                logger.warning(f"❌ Connection Lost: {e}. Retrying in {backoff_delay}s...")
                await asyncio.sleep(backoff_delay)
                backoff_delay = min(backoff_delay * 2, max_backoff)
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                await asyncio.sleep(5)

    async def consume_and_process(self):
        """
        Consumer Coroutine:
        Reads from Queue and performs Logic (e.g., Inference).
        Simulation of heavy processing is included.
        """
        logger.info("Starting Processor...")
        while self.running:
            tick: MarketTick = await self.queue.get()
            
            # --- START PROCESSING LOGIC ---
            
            # Calculate Latency
            process_start = time.time()
            ws_latency = (process_start - tick.received_time) * 1000
            
            if ws_latency > 100:
                logger.warning(f"🐢 High Latency detected: {ws_latency:.2f}ms")

            # Simulate heavy AI Inference work (randomized)
            # await asyncio.sleep(0.001) 

            # Example: Publish to Redis or Trigger Strategy
            # await self.redis.set(f"price:{tick.symbol}", tick.price)
            
            # logger.debug(f"Processed {tick.symbol} @ {tick.price}")
            
            # --- END PROCESSING LOGIC ---

    async def start(self):
        self.running = True
        logger.info(f"🚀 Launching Market Data Engine for {self.symbol}")
        
        # Create separate tasks for Producer and Consumer
        producer_task = asyncio.create_task(self.connect_and_produce())
        consumer_task = asyncio.create_task(self.consume_and_process())
        
        try:
            await asyncio.gather(producer_task, consumer_task)
        except asyncio.CancelledError:
            logger.info("Engine stopping...")

if __name__ == "__main__":
    # Example Usage: BTCUSDT Aggregated Trade Stream
    SYMBOL = "btcusdt"
    STREAM_URL = f"wss://stream.binance.com:9443/ws/{SYMBOL}@aggTrade"
    
    consumer = MarketDataConsumer(SYMBOL, STREAM_URL)
    
    try:
        asyncio.run(consumer.start())
    except KeyboardInterrupt:
        pass
