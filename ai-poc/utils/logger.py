"""
Structured logging utility for NyayaSankalan AI-POC
Provides consistent logging across all modules with context and metadata
"""

import logging
import sys
from datetime import datetime
from typing import Any, Dict, Optional
import json

# Configure logging format
class StructuredFormatter(logging.Formatter):
    """Custom formatter that outputs structured JSON logs"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "module": record.module,
            "function": record.funcName,
            "message": record.getMessage(),
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields if present
        if hasattr(record, "extra_data"):
            log_data.update(record.extra_data)
        
        return json.dumps(log_data)


class StructuredLogger:
    """Wrapper for structured logging with context"""
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        
        # Remove existing handlers
        self.logger.handlers = []
        
        # Add console handler with structured formatter
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(StructuredFormatter())
        self.logger.addHandler(handler)
    
    def _log(self, level: int, message: str, extra_data: Optional[Dict[str, Any]] = None):
        """Internal method to log with extra data"""
        if extra_data:
            self.logger.log(level, message, extra={"extra_data": extra_data})
        else:
            self.logger.log(level, message)
    
    def info(self, message: str, **kwargs):
        """Log info level message with optional context"""
        self._log(logging.INFO, message, kwargs if kwargs else None)
    
    def warning(self, message: str, **kwargs):
        """Log warning level message with optional context"""
        self._log(logging.WARNING, message, kwargs if kwargs else None)
    
    def error(self, message: str, **kwargs):
        """Log error level message with optional context"""
        self._log(logging.ERROR, message, kwargs if kwargs else None)
    
    def debug(self, message: str, **kwargs):
        """Log debug level message with optional context"""
        self._log(logging.DEBUG, message, kwargs if kwargs else None)
    
    def exception(self, message: str, **kwargs):
        """Log exception with traceback"""
        self.logger.exception(message, extra={"extra_data": kwargs} if kwargs else None)


# Create logger instances for different modules
def get_logger(module_name: str) -> StructuredLogger:
    """Get a structured logger for a specific module"""
    return StructuredLogger(module_name)
