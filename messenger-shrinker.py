import os
import zipfile

# Function to remove specific folders from the zip file
def shrink_zip(input_zip_file):
    output_zip_file = input_zip_file.replace(".zip", "-shrinked.zip")

    try:
        with zipfile.ZipFile(input_zip_file, 'r') as zip_in:
            with zipfile.ZipFile(output_zip_file, 'w') as zip_out:
                for item in zip_in.infolist():
                    # Skip specific folders you want to remove
                    if item.filename not in ["files/", "gifs/", "photos/", "videos/"]:
                        data = zip_in.read(item.filename)
                        zip_out.writestr(item, data)

        print(f'Shrinked ZIP file saved as {output_zip_file}')
    except Exception as e:
        print(f'Error: {e}')

if __name__ == "__main__":
    while True:
        input_zip_file = input("Enter the path to the ZIP file: ")

        # Check if the input is a valid ZIP file
        if not input_zip_file.endswith(".zip") or not os.path.isfile(input_zip_file):
            print("Invalid input. Please provide a valid ZIP file.")
            continue

        shrink_zip(input_zip_file)
        break
