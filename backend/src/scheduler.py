import asyncio
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from src.core.logging import log_error, log_info
from src.currency.service import get_currency_service

logger = logging.getLogger(__name__)

# Global scheduler instance
_scheduler: AsyncIOScheduler | None = None


async def fetch_currency_rates_job() -> None:
    """Job to fetch daily currency rates."""
    log_info("Running scheduled job: fetch_currency_rates")
    try:
        currency_service = get_currency_service()
        await currency_service.fetch_daily_rates()
        log_info("Scheduled job completed: fetch_currency_rates")
    except Exception as e:
        # Log but don't crash - rates will be fetched on next scheduled run
        log_error("Scheduled job failed: fetch_currency_rates", error=e)


def get_scheduler() -> AsyncIOScheduler:
    """Get the global scheduler instance."""
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler()
    return _scheduler


async def start_scheduler() -> None:
    """Start the scheduler and run initial jobs."""
    scheduler = get_scheduler()

    # Schedule daily currency rate fetch at 9:00 UTC
    scheduler.add_job(
        fetch_currency_rates_job,
        CronTrigger(hour=9, minute=0, timezone="UTC"),
        id="fetch_currency_rates",
        name="Fetch daily currency exchange rates",
        replace_existing=True,
    )

    scheduler.start()
    log_info("Scheduler started", jobs=[job.name for job in scheduler.get_jobs()])

    # Fetch rates immediately on startup with retries
    currency_service = get_currency_service()
    if not currency_service.has_rates:
        log_info("No cached rates found, fetching on startup")
        max_retries = 3
        for attempt in range(1, max_retries + 1):
            try:
                await currency_service.fetch_daily_rates()
                log_info("Currency rates fetched successfully on startup")
                break
            except Exception as e:
                # Only report to Sentry on final failure
                should_capture = attempt == max_retries
                log_error(
                    f"Failed to fetch rates on startup (attempt {attempt}/{max_retries})",
                    error=e,
                    capture_sentry=should_capture,
                )
                if attempt < max_retries:
                    await asyncio.sleep(2)  # Wait 2 seconds before retry


def stop_scheduler() -> None:
    """Stop the scheduler."""
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown()
        log_info("Scheduler stopped")
        _scheduler = None
