"""Fetch a page with Scrapling and print a JSON result to stdout.

Used by the Node scrapers when a store (Ripley, behind Cloudflare) blocks the
plain Node/curl request. Scrapling's Fetcher uses curl_cffi to impersonate a
real Chrome TLS/HTTP2 fingerprint, which is what Cloudflare's bot checks look
at. The optional "stealthy" mode drives a real browser (Camoufox) and needs
`scrapling install`; it is heavy and usually does not fit Render's free plan.

Usage: python scrapling_fetch.py <url> [--timeout SECONDS] [--mode fetcher|stealthy]
Output: {"status": int, "url": str, "html": str} or {"error": str}
"""

import argparse
import json
import logging
import sys


def fetch(url, timeout, mode):
    if mode == "stealthy":
        from scrapling.fetchers import StealthyFetcher

        page = StealthyFetcher.fetch(
            url,
            headless=True,
            solve_cloudflare=True,
            network_idle=False,
            timeout=timeout * 1000,
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
        )
    return {"status": page.status, "url": str(page.url), "html": page.html_content}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("--timeout", type=int, default=30)
    parser.add_argument("--mode", choices=["fetcher", "stealthy"], default="fetcher")
    args = parser.parse_args()

    # Scrapling logs to stdout/stderr; keep stdout clean for the JSON payload.
    logging.disable(logging.CRITICAL)
    try:
        result = fetch(args.url, args.timeout, args.mode)
    except Exception as error:  # noqa: BLE001 - report any failure to the caller
        json.dump({"error": f"{type(error).__name__}: {error}"}, sys.stdout)
        return 1
    json.dump(result, sys.stdout)
    return 0


if __name__ == "__main__":
    sys.exit(main())
