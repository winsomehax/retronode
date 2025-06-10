import json
import re

def slugify(name):
    """Converts a string to a URL-friendly slug."""
    if not isinstance(name, str):
        return None
    name = re.sub(r'[^\w\s-]', '', name).strip().lower()
    name = re.sub(r'[-\s]+', '-', name)
    return name

def extract_release_year(overview):
    """Attempts to extract a release year from a text overview."""
    if not isinstance(overview, str):
        return None
    # Common patterns for release year: "released in YYYY", "introduced in YYYY", "debuted YYYY"
    match = re.search(r'\b(?:released|introduced|debuted|launched|first released|produced).*?in\s+(\d{4})\b', overview, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None

def merge_platform_data(platforms_config_path, tgdb_platforms_path):
    """
    Merges data from tgdb_platforms into platforms.json,
    creating new entries and attempting to fill missing fields.
    Handles potential inconsistencies in tgdb_id/tgdb_name mappings.
    """
    with open(platforms_config_path, 'r', encoding='utf-8') as f:
        platforms_config = json.load(f)

    with open(tgdb_platforms_path, 'r', encoding='utf-8') as f:
        tgdb_platforms_raw = json.load(f)

    # Clean up tgdb_platforms: remove '\r\n' from overview
    tgdb_platforms = {}
    for tgdb_id, data in tgdb_platforms_raw.items():
        if 'overview' in data and data['overview'] is not None:
            data['overview'] = data['overview'].replace('\r\n', ' ').strip()
        tgdb_platforms[tgdb_id] = data


    # Create a mapping from tgdb_id to the TGDB platform data for quick lookup
    tgdb_id_to_data = {k: v for k, v in tgdb_platforms.items()}

    # Create a mapping from platform name (slugified) to TGDB_ID for primary matching
    tgdb_slug_to_id = {slugify(v['name']): k for k, v in tgdb_platforms.items() if v.get('name')}

    # Initialize the merged data with the existing platforms.json content
    # This ensures existing platform slugs are preserved unless explicitly overridden by a TGDB slug
    merged_platforms = {}

    # First pass: Copy existing platforms, trying to correct their tgdb_id/tgdb_name if they are wrong
    # based on their own name
    for existing_slug, existing_data in platforms_config.items():
        corrected_entry = existing_data.copy()

        # Try to find the correct tgdb_id based on the platform's actual name
        platform_name_slug = slugify(existing_data.get('name'))
        if platform_name_slug and platform_name_slug in tgdb_slug_to_id:
            correct_tgdb_id_for_name = tgdb_slug_to_id[platform_name_slug]
            if correct_tgdb_id_for_name != existing_data.get('tgdb_id'):
                # Correct the tgdb_id if it's mismatched, assuming the name in platforms.json is correct
                # Example: c64 had tgdb_id "15" (Xbox 360), this will now be "40"
                print(f"Correcting tgdb_id for '{existing_slug}': from '{existing_data.get('tgdb_id')}' to '{correct_tgdb_id_for_name}' based on name.")
                corrected_entry['tgdb_id'] = correct_tgdb_id_for_name
                # Also update tgdb_name to match the newly corrected tgdb_id's name
                corrected_entry['tgdb_name'] = tgdb_id_to_data[correct_tgdb_id_for_name].get('name')
            else:
                # tgdb_id matches, ensure tgdb_name also matches TGDB's record
                if tgdb_id_to_data.get(correct_tgdb_id_for_name) and \
                   tgdb_id_to_data[correct_tgdb_id_for_name].get('name') != existing_data.get('tgdb_name'):
                    print(f"Correcting tgdb_name for '{existing_slug}': from '{existing_data.get('tgdb_name')}' to '{tgdb_id_to_data[correct_tgdb_id_for_name].get('name')}'")
                    corrected_entry['tgdb_name'] = tgdb_id_to_data[correct_tgdb_id_for_name].get('name')

        merged_platforms[existing_slug] = corrected_entry

    # Second pass: Iterate through tgdb_platforms and add/update entries
    for tgdb_id, tgdb_data in tgdb_id_to_data.items():
        tgdb_platform_name = tgdb_data.get("name")
        if not tgdb_platform_name:
            print(f"Warning: TGDB entry with ID {tgdb_id} has no name. Skipping.")
            continue

        generated_slug = slugify(tgdb_platform_name)
        if not generated_slug: # Should not happen if tgdb_platform_name exists
             print(f"Warning: Could not generate slug for TGDB entry with ID {tgdb_id} and name '{tgdb_platform_name}'. Skipping.")
             continue

        # Check if this TGDB entry corresponds to an existing platform in our merged_platforms
        # This is the most crucial part: if we have an existing entry that *now* correctly points to this tgdb_id,
        # or if the slug matches, we should update that existing entry.
        matched_existing_slug = None
        for current_slug, current_data in merged_platforms.items():
            if current_data.get('tgdb_id') == tgdb_id:
                matched_existing_slug = current_slug
                break
        
        if not matched_existing_slug:
            # If no existing platform explicitly matches this tgdb_id, check by slugified name
            if generated_slug in merged_platforms:
                # Potential slug collision or existing platform with same name but no tgdb_id
                # Only use this if the existing entry's tgdb_id is None or different
                if not merged_platforms[generated_slug].get('tgdb_id') or \
                   merged_platforms[generated_slug].get('tgdb_id') != tgdb_id:
                    matched_existing_slug = generated_slug
            
        
        if matched_existing_slug:
            # Update existing entry
            target_entry = merged_platforms[matched_existing_slug]
            target_entry["name"] = tgdb_platform_name
            target_entry["short_name"] = target_entry.get("short_name", tgdb_platform_name)
            target_entry["manufacturer"] = tgdb_data.get("manufacturer") or target_entry.get("manufacturer")
            target_entry["release_year"] = target_entry.get("release_year") or extract_release_year(tgdb_data.get("overview"))
            target_entry["image_url"] = target_entry.get("image_url", "") # Keep existing if any, else empty
            target_entry["description"] = tgdb_data.get("overview") or target_entry.get("description", "")
            target_entry["emulators"] = target_entry.get("emulators", []) # Keep existing if any, else empty list
            target_entry["tgdb_id"] = tgdb_id
            target_entry["tgdb_name"] = tgdb_platform_name
        else:
            # Add as a new entry
            final_slug_for_new_entry = generated_slug
            counter = 1
            while final_slug_for_new_entry in merged_platforms:
                final_slug_for_new_entry = f"{generated_slug}-{counter}"
                counter += 1

            new_entry = {
                "name": tgdb_platform_name,
                "short_name": tgdb_platform_name,
                "manufacturer": tgdb_data.get("manufacturer"),
                "release_year": extract_release_year(tgdb_data.get("overview")),
                "image_url": "", # Placeholder, cannot guess
                "description": tgdb_data.get("overview", ""),
                "emulators": [], # Placeholder, cannot guess
                "tgdb_id": tgdb_id,
                "tgdb_name": tgdb_platform_name
            }
            # Clean up None values
            new_entry = {k: v for k, v in new_entry.items() if v is not None}
            merged_platforms[final_slug_for_new_entry] = new_entry
            print(f"Added new platform: '{final_slug_for_new_entry}' from TGDB ID {tgdb_id}")

    # Final pass to ensure all original entries from platforms.json are present
    # if they weren't explicitly matched and updated by a tgdb_id from tgdb_platforms.
    # This covers cases where platforms.json has entries not present in tgdb_platforms.
    for original_slug, original_data in platforms_config.items():
        if original_slug not in merged_platforms:
            # This platform was in the original platforms.json but didn't have a TGDB match
            # or its tgdb_id was too mismatched to be correctly updated by TGDB's data.
            # Add it back, but ensure its tgdb_id/tgdb_name are reset if they were incorrect.
            print(f"Re-adding original platform '{original_slug}' (not found in TGDB or its TGDB mapping was ambiguous).")
            cleaned_original_data = original_data.copy()
            
            # If its tgdb_id was present but not found in tgdb_id_to_data or mapped to a different name,
            # we should clear it to avoid false mappings.
            original_tgdb_id = original_data.get('tgdb_id')
            if original_tgdb_id:
                tgdb_matched_name = tgdb_id_to_data.get(original_tgdb_id, {}).get('name')
                if tgdb_matched_name and slugify(tgdb_matched_name) != slugify(original_data.get('name')):
                    print(f"  Clearing incorrect tgdb_id '{original_tgdb_id}' and tgdb_name for '{original_slug}'.")
                    cleaned_original_data['tgdb_id'] = None
                    cleaned_original_data['tgdb_name'] = None
            
            merged_platforms[original_slug] = cleaned_original_data


    # Sort the dictionary by keys (platform slugs) for consistent output
    sorted_merged_platforms = dict(sorted(merged_platforms.items()))

    return sorted_merged_platforms

if __name__ == "__main__":
    # Assuming 'platforms.json' and 'tgdb_platforms.json' are in a 'data' subdirectory
    platforms_config_path = "../data/platforms.json"
    tgdb_platforms_path = "../data/tgdb_platforms.json"

    # Alternatively, if they are in the same directory as the script:
    # platforms_config_path = "platforms.json"
    # tgdb_platforms_path = "tgdb_platforms.json"

    merged_data = merge_platform_data(platforms_config_path, tgdb_platforms_path)

    output_filename = "merged_platforms.json"
    with open(output_filename, 'w', encoding='utf-8') as f:
        json.dump(merged_data, f, indent=2)

    print(f"\nMerged data saved to {output_filename}")
    print("\nIMPORTANT: Please review 'merged_platforms.json'.")
    print("  - Fields like 'image_url' and 'emulators' for new entries are placeholders and need manual review.")
    print("  - 'release_year' is a best guess from the 'overview' and may require manual verification.")
    print("  - Some 'tgdb_id' and 'tgdb_name' fields for existing entries in your original 'platforms.json' ")
    print("    might have been corrected if they mismatched the platform's actual name according to TGDB data.")
