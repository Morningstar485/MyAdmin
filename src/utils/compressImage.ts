import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
    const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp'
    };

    try {
        const compressedFile = await imageCompression(file, options);
        // Rename file to .webp if it isn't (though blob type is correct, name prop might be old)
        const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
        return new File([compressedFile], newName, { type: 'image/webp' });
    } catch (error) {
        console.error("Compression failed:", error);
        return file; // Fallback to original if compression fails
    }
}
