"""Fetch a page with Scrapling and print a JSON result to stdout.

Used by the Node scrapers when a store (Ripley, behind Cloudflare) blocks the
plain Node/curl request. Scrapling's Fetcher uses curl_cffi to impersonate a
real Chrome TLS/HTTP2 fingerprint, which is what Cloudflare's bot checks look
at. The optional "stealthy" mode drives a real browser (Camoufox) and needs
`scrapling install`; it is heavy and usually does not fit Render's free plan.

Usage: python scrapling_fetch.py <url> [--timeout SECONDS] [--mode fetcher|stealthy] [--proxy URL]
Output: {"status": int, "url": str, "html": str, "diagnostic": str|null} or {"error": str}
"""

import argparse
import json
import logging
import re
import sys


def diagnose(page):
    """Short hint about why a non-200 came back (Cloudflare challenge vs hard block)."""
    headers = {k.lower(): v for k, v in dict(page.headers or {}).items()}
    title = re.search(r"<title[^>]*>(.*?)</title>", page.html_content or "", re.I | re.S)
    parts = [
        f"server={headers.get('server', '?')}",
        f"cf-mitigated={headers.get('cf-mitigated', '-')}",
        f"title={title.group(1).strip()[:80] if title else '-'}",
    ]
    return ", ".join(parts)


def fetch(url, timeout, mode, proxy):
    if mode == "stealthy":
        from scrapling.fetchers import StealthyFetcher

        page = StealthyFetcher.fetch(
            url,
            headless=True,
            solve_cloudflare=True,
            network_idle=False,
            timeout=timeout * 1000,
            proxy=proxy,
        )
    else:
        from scrapling.fetchers import Fetcher

        page = Fetcher.get(
            url,
            impersonate="chrome",
            stealthy_headers=True,
            follow_redirects=True,
            timeout=timeout,
            retries=2,
            proxy=proxy,
        )
    diagnostic = None if page.status == 200 else diagnose(page)
    return {"status": page.status, "url": str(page.url), "html": page.html_content, "diagnostic": diagnostic}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("--timeout", type=int, default=30)
    parser.add_argument("--mode", choices=["fetcher", "stealthy"], default="fetcher")
    parser.add_argument("--proxy", default=None)
    args = parser.parse_args()

    # Scrapling logs to stdout/stderr; keep stdout clean for the JSON payload.
    logging.disable(logging.CRITICAL)
    try:
        result = fetch(args.url, args.timeout, args.mode, args.proxy or None)
    except Exception as error:  # noqa: BLE001 - report any failure to the caller
        json.dump({"error": f"{type(error).__name__}: {error}"}, sys.stdout)
        return 1
    json.dump(result, sys.stdout)
    return 0


if __name__ == "__main__":
    sys.exit(main())
