import { useFormContext } from "react-hook-form";
import { HotelFormData } from "./ManageHotelForm";
import { useState, useRef, useEffect, useCallback } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";

interface ImagePreview {
  id: string;
  file?: File;
  url: string;
  isExisting: boolean;
}

const ImagesSection = () => {
  const {
    formState: { errors },
    watch,
    setValue,
    setError,
    clearErrors,
  } = useFormContext<HotelFormData>();

  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const existingImageUrls = watch("imageUrls");

  // Initialize with existing images
  useEffect(() => {
    if (existingImageUrls && existingImageUrls.length > 0) {
      const existingPreviews: ImagePreview[] = existingImageUrls.map(
        (url, index) => ({
          id: `existing-${index}`,
          url,
          isExisting: true,
        })
      );
      setImagePreviews(existingPreviews);
    }
  }, [existingImageUrls]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newPreviews: ImagePreview[] = Array.from(files).map(
      (file, index) => ({
        id: `new-${Date.now()}-${index}`,
        file,
        url: URL.createObjectURL(file),
        isExisting: false,
      })
    );

    const updatedPreviews = [...imagePreviews, ...newPreviews];

    // Update form values
    const newFiles = Array.from(files);
    const currentFiles = Array.from(watch("imageFiles") || []);
    const allFiles = [...currentFiles, ...newFiles];

    // Create a new FileList-like object
    const dataTransfer = new DataTransfer();
    allFiles.forEach((file) => dataTransfer.items.add(file));

    setValue("imageFiles", dataTransfer.files);
    setImagePreviews(updatedPreviews);
  };

  const handleDeleteImage = (imageId: string) => {
    const imageToDelete = imagePreviews.find((img) => img.id === imageId);
    if (!imageToDelete) return;

    const updatedPreviews = imagePreviews.filter((img) => img.id !== imageId);
    setImagePreviews(updatedPreviews);

    if (imageToDelete.isExisting) {
      // Remove from existing imageUrls
      const updatedUrls = existingImageUrls.filter(
        (url) => url !== imageToDelete.url
      );
      setValue("imageUrls", updatedUrls);
    } else {
      // Remove from new imageFiles
      const currentFiles = Array.from(watch("imageFiles") || []);
      const updatedFiles = currentFiles.filter((file) => {
        if (imageToDelete.file) {
          return file !== imageToDelete.file;
        }
        return true;
      });

      const dataTransfer = new DataTransfer();
      updatedFiles.forEach((file) => dataTransfer.items.add(file));
      setValue(
        "imageFiles",
        updatedFiles.length > 0 ? dataTransfer.files : undefined
      );
    }

    // Clean up object URL
    if (!imageToDelete.isExisting) {
      URL.revokeObjectURL(imageToDelete.url);
    }
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };

  const totalImages = imagePreviews.length;

  // Custom validation
  const validateImages = useCallback(() => {
    if (totalImages === 0) {
      return "At least one image should be added";
    }
    if (totalImages > 6) {
      return "Total number of images cannot be more than 6";
    }
    return true;
  }, [totalImages]);

  // Set validation error if needed
  useEffect(() => {
    const validationResult = validateImages();
    if (validationResult !== true) {
      setError("imageFiles", { message: validationResult });
    } else {
      clearErrors("imageFiles");
    }
  }, [totalImages, setError, clearErrors, validateImages]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg shadow-slate-900/5">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-400">
          07 · Gallery
        </p>
        <h2 className="text-3xl font-semibold text-slate-900">Immersive visuals</h2>
        <p className="text-base text-slate-500">
          Upload up to 6 images. Drag-and-drop feel keeps your gallery curated and premium.
        </p>
      </div>
      <div className="mt-8 flex flex-col gap-6 rounded-2xl border border-dashed border-slate-200/80 p-6">
        {/* Upload Area */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-8 text-center transition-transform hover:scale-[1.01]">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-indigo-50/80 p-3">
              <Upload className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">
                Upload Hotel Images
              </h3>
              <p className="mb-4 text-slate-500">
                Select multiple images to upload. You can upload up to 6 images
                total.
              </p>
              <Button
                onClick={handleUploadClick}
                variant="outline"
                className="bg-white text-slate-900 hover:bg-slate-50"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Choose Images
              </Button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Selected Images ({totalImages}/6)
              </h3>
              {totalImages > 6 && (
                <span className="text-sm font-medium text-rose-500">
                  Maximum 6 images allowed
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {imagePreviews.map((image) => (
                <div
                  key={image.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50"
                >
                  <img
                    src={image.url}
                    alt="Hotel preview"
                    className="object-cover w-full h-32"
                  />
                  <div className="absolute inset-0 flex items-center justify-center transition-all duration-200 bg-black bg-opacity-0 group-hover:bg-opacity-50">
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteImage(image.id);
                      }}
                      variant="destructive"
                      size="sm"
                      className="transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                  <div className="p-2">
                    <Badge
                      variant={image.isExisting ? "outline" : "default"}
                      className="text-xs"
                    >
                      {image.isExisting ? "Existing" : "New Upload"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {errors.imageFiles && (
          <div className="rounded-2xl bg-rose-50 p-3 text-sm font-medium text-rose-600">
            {errors.imageFiles.message}
          </div>
        )}
      </div>
    </section>
  );
};

export default ImagesSection;
