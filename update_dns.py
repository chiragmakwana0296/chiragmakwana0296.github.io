#!/usr/bin/env python3
import json
import urllib.request
import urllib.error
import sys

DOMAIN = "chiragmakwana.in"
GITHUB_IO_TARGET = "chiragmakwana0296.github.io"

GITHUB_IPS = [
    "185.199.108.153",
    "185.199.109.153",
    "185.199.110.153",
    "185.199.111.153"
]

def update_dns_record(domain, rtype, name, data, api_key, api_secret):
    url = f"https://api.godaddy.com/v1/domains/{domain}/records/{rtype}/{name}"
    headers = {
        "Authorization": f"sso-key {api_key}:{api_secret}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers=headers,
        method="PUT"
    )
    
    try:
        with urllib.request.urlopen(req) as res:
            if res.status == 200:
                print(f"  [SUCCESS] Updated {rtype} record for '{name}'")
            else:
                print(f"  [WARNING] Received status code {res.status}")
    except urllib.error.HTTPError as e:
        print(f"  [ERROR] HTTP Error {e.code}: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"  [ERROR] Failed to update: {e}")

def main():
    print(f"=== GoDaddy DNS Configurator for GitHub Pages ===")
    print(f"Domain: {DOMAIN}")
    print(f"Target: {GITHUB_IO_TARGET}")
    print("-------------------------------------------------")
    
    # Prompt for credentials
    api_key = input("Enter your GoDaddy API Key: ").strip()
    if not api_key:
        print("API Key cannot be empty.")
        sys.exit(1)
        
    api_secret = input("Enter your GoDaddy API Secret: ").strip()
    if not api_secret:
        print("API Secret cannot be empty.")
        sys.exit(1)
    
    print("\nUpdating apex domain '@' A records...")
    a_records = [{"type": "A", "name": "@", "data": ip, "ttl": 600} for ip in GITHUB_IPS]
    update_dns_record(DOMAIN, "A", "%40", a_records, api_key, api_secret)
    
    print("\nUpdating 'www' CNAME record...")
    cname_records = [{"type": "CNAME", "name": "www", "data": GITHUB_IO_TARGET, "ttl": 600}]
    update_dns_record(DOMAIN, "CNAME", "www", cname_records, api_key, api_secret)
    
    print("\nDone! Please allow up to 10-30 minutes for DNS propagation.")

if __name__ == "__main__":
    main()
