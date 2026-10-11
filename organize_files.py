"""
File Organizer Script
Automatically organizes files by extension:
- .jpg, .jpeg, .gif -> Images/
- .txt (excluding requirements.txt) -> Documents/
- .mp4 -> Videos/
"""

import os
import shutil
import sys

# Supported extensions mapping
DEST_MAPPING = {
    ".jpg": "Images",
    ".jpeg": "Images",
    ".gif": "Images",
    ".txt": "Documents",
    ".mp4": "Videos"
}

# Files that should not be moved from root
EXCLUDED_FILES = {
    "requirements.txt"
}

def organize_directory(target_dir="."):
    target_path = os.path.abspath(target_dir)
    print(f"📁 Đang quét và phân loại tệp trong: {target_path}")

    # Ensure destination directories exist
    for folder in set(DEST_MAPPING.values()):
        os.makedirs(os.path.join(target_path, folder), exist_ok=True)

    moved_count = {folder: 0 for folder in set(DEST_MAPPING.values())}
    moved_files = []

    # Iterate through files in target directory (non-recursive)
    for entry in os.listdir(target_path):
        full_path = os.path.join(target_path, entry)

        # Skip directories and excluded files
        if not os.path.isfile(full_path):
            continue
        if entry.lower() in EXCLUDED_FILES:
            continue

        _, ext = os.path.splitext(entry)
        ext_lower = ext.lower()

        if ext_lower in DEST_MAPPING:
            dest_folder = DEST_MAPPING[ext_lower]
            dest_path = os.path.join(target_path, dest_folder, entry)

            # Avoid overwriting existing files with same name
            if os.path.exists(dest_path):
                base_name, file_ext = os.path.splitext(entry)
                counter = 1
                while os.path.exists(os.path.join(target_path, dest_folder, f"{base_name}_{counter}{file_ext}")):
                    counter += 1
                dest_path = os.path.join(target_path, dest_folder, f"{base_name}_{counter}{file_ext}")

            shutil.move(full_path, dest_path)
            moved_count[dest_folder] += 1
            moved_files.append((entry, dest_folder, os.path.basename(dest_path)))
            print(f"  ✓ Đã chuyển '{entry}' -> '{dest_folder}/'")

    total_moved = sum(moved_count.values())
    print("\n--- Báo cáo kết quả ---")
    if total_moved == 0:
        print("ℹ️ Không tìm thấy tệp nào phù hợp cần di chuyển (ngoại trừ requirements.txt được giữ nguyên).")
    else:
        print(f"✅ Đã di chuyển tổng cộng {total_moved} tệp:")
        for folder, count in moved_count.items():
            if count > 0:
                print(f"  • {folder}/: {count} tệp")

    return moved_files

if __name__ == "__main__":
    dir_to_organize = sys.argv[1] if len(sys.argv) > 1 else "."
    organize_directory(dir_to_organize)
