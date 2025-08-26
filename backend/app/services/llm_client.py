import os
import requests
import logging
from dotenv import load_dotenv, find_dotenv
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Robustly load .env regardless of current working directory
try:
    loaded = load_dotenv(find_dotenv(filename=".env", usecwd=True))
    if not loaded:
        # Fallback: attempt to load backend/.env relative to this file
        here = os.path.dirname(__file__)
        backend_root = os.path.abspath(os.path.join(here, "..", ".."))
        dotenv_path = os.path.join(backend_root, ".env")
        load_dotenv(dotenv_path)
except Exception:
    # Don't fail app start if dotenv load has issues
    pass

# Module-level session for HTTP keep-alive across requests
_session = requests.Session()

# Configure retry strategy for robustness on flaky networks/proxies
_retry_total = int(os.getenv("HTTP_RETRY_TOTAL", "3"))
_retry_backoff = float(os.getenv("HTTP_RETRY_BACKOFF", "0.5"))
_retry = Retry(
    total=_retry_total,
    connect=_retry_total,
    read=_retry_total,
    backoff_factor=_retry_backoff,
    status_forcelist=(429, 500, 502, 503, 504),
    allowed_methods=frozenset(["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "PATCH"]),
)
_adapter = HTTPAdapter(max_retries=_retry, pool_connections=10, pool_maxsize=10)
_session.mount("https://", _adapter)
_session.mount("http://", _adapter)

# Tunables for responsiveness
DEFAULT_TIMEOUT = float(os.getenv("LLM_TIMEOUT_SECONDS", "30"))
DEFAULT_MAX_TOKENS = int(os.getenv("CHAT_MAX_TOKENS", "400"))

logger = logging.getLogger(__name__)


class LLMClient:
    def __init__(self):
        provider = os.getenv("LLM_PROVIDER", "mistral")
        logger.info(f"Initializing LLM client with provider: {provider}")

        if provider == "mistral":
            self.url = os.getenv(
                "MISTRAL_API_URL", "https://api.mistral.ai/v1/chat/completions"
            )
            connection_hdr = os.getenv("HTTP_CONNECTION", "close")
            self.headers = {
                "Authorization": f"Bearer {os.getenv('MISTRAL_API_KEY', '')}",
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Connection": connection_hdr,
            }
            self.model = os.getenv("MISTRAL_MODEL", "mistral-medium-latest")
        elif provider == "openai":
            self.url = "https://api.openai.com/v1/chat/completions"
            connection_hdr = os.getenv("HTTP_CONNECTION", "close")
            self.headers = {
                "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY', '')}",
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Connection": connection_hdr,
            }
            self.model = os.getenv("OPENAI_MODEL", "gpt-4o")
        else:
            logger.error(f"Unsupported LLM provider: {provider}")
            raise ValueError(f"Unsupported LLM provider: {provider}")

        # SSL verification settings: allow custom CA bundle or disable via env (for diagnostics only)
        ca_bundle = os.getenv("REQUESTS_CA_BUNDLE") or os.getenv("SSL_CERT_FILE") or os.getenv("CA_BUNDLE_PATH")
        if os.getenv("DISABLE_SSL_VERIFY", "false").lower() == "true":
            self.verify = False
        else:
            self.verify = ca_bundle if ca_bundle else True

        logger.info(f"LLM client initialized with model: {self.model}")

    def chat(self, messages: list[dict], **kw):
        """
        Make an API call to the LLM provider for chat completion.

        Args:
            messages: List of message dictionaries with 'role' and 'content'
            **kw: Additional keyword arguments to pass to the API (e.g., temperature)

        Returns:
            The JSON response from the API
        """
        payload = {"model": self.model, "messages": messages, **kw}
        # Keep responses concise for latency unless caller overrides
        payload.setdefault("max_tokens", DEFAULT_MAX_TOKENS)
        logger.debug(f"Sending chat request with {len(messages)} messages")

        try:
            response = _session.post(
                self.url,
                headers=self.headers,
                json=payload,
                timeout=DEFAULT_TIMEOUT,
                verify=self.verify,
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling LLM API: {e}", exc_info=True)
            # Return a simplified error response that won't break downstream code
            return {
                "error": str(e),
                "choices": [
                    {
                        "message": {
                            "content": f"I'm sorry, I encountered an error communicating with the LLM service: {str(e)}"
                        }
                    }
                ],
            }
