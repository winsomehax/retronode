#!/usr/bin/env python3
import json
import os
import requests

# API URL for platforms with API key
url = "https://api.thegamesdb.net/v1/Platforms?apikey=ab7ee8591b660ef9fbfde5e9d51db8e0ff867901c17a49350ed8e9b03fadd30d&fields=icon,console,manufacturer,developer,overview"

# Path to platforms.json
platforms_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'platforms.json')

# Mapping of TheGamesDB platform IDs to our platform IDs
platform_mapping = {
    '1': 'nes',     # Nintendo Entertainment System
    '15': 'c64',    # Commodore 64
    '4911': 'amiga', # Commodore Amiga
    '4912': 'atarist', # Atari ST
    '4913': 'spectrum' # ZX Spectrum
}

try:
    # Fetch platforms from TheGamesDB
    response = requests.get(url)
    response.raise_for_status()
    
    # Parse response
    data = response.json()
    
    if 'data' not in data or 'platforms' not in data['data']:
        print("Error: Unexpected API response format")
        exit(1)
    
    # Extract platforms
    tgdb_platforms = data['data']['platforms']
    
    # Create mapping dictionary
    platform_id_map = {}
    for platform_id, platform_data in tgdb_platforms.items():
        platform_id_map[platform_id] = {
            'name': platform_data.get('name', ''),
            'manufacturer': platform_data.get('manufacturer', ''),
            'overview': platform_data.get('overview', '')
        }
    
    # Load existing platforms.json
    with open(platforms_path, 'r') as f:
        platforms = json.load(f)
    
    # Create a new field in each platform for TheGamesDB ID
    for tgdb_id, our_id in platform_mapping.items():
        if our_id in platforms and tgdb_id in platform_id_map:
            platforms[our_id]['tgdb_id'] = tgdb_id
            platforms[our_id]['tgdb_name'] = platform_id_map[tgdb_id]['name']
    
    # Save updated platforms.json
    with open(platforms_path, 'w') as f:
        json.dump(platforms, f, indent=2)
    
    # Save complete mapping to a separate file for reference
    mapping_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'tgdb_platforms.json')
    with open(mapping_path, 'w') as f:
        json.dump(platform_id_map, f, indent=2)
    
    print(f"Updated {platforms_path} with TheGamesDB platform IDs")
    print(f"Saved complete platform mapping to {mapping_path}")
    
except Exception as e:
    print(f"Error: {e}")
    exit(1)