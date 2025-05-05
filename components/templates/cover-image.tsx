"use client";

import { useState } from "react";
import { CldUploadWidget, CldImage } from "next-cloudinary";
import { toast } from "react-toastify";
import Image from "next/image";
import { useTranslations } from 'next-intl'; // Import useTranslations


const cloudPresetName = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
type coverImgProps ={
    value: string | null | undefined;
    onChange: (imageUrl: string | null) => void;
}

export default function CoverImage({value, onChange}: coverImgProps) {
  const t = useTranslations('CoverImage'); // Initialize translations
  

  return (
    <div className="relative h-40 w-full bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-700 dark:to-blue-600 rounded-lg border-1 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors overflow-hidden">
      {value ? (
        <Image
          src={value}
          alt="Cover"
          width={1200}
          height={160}
          className="w-full h-full object-cover object-center"
        />
      ) : (
        <CldUploadWidget
          uploadPreset={cloudPresetName}
          options={{
            folder: "form_craft",
            resourceType: "image",
            multiple: false,
          }}
          onSuccess={(result, { widget }) => {
            const info = result.info;
            if (info && typeof info === "object" && "secure_url" in info) {
              onChange(info.secure_url as string);
              console.log(info.secure_url as string);
            }
            toast.success(t('uploadSuccess'), { // Use translation
              position: "top-center",
              autoClose: 3000,
            });
             widget.close();
          }}
        >
          {({ open }) => (
            <div
              className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center text-gray-500 dark:text-gray-400"
              onClick={() => open()}
            >
              {/* SVG remains the same */}
              <p className="text-sm text-gray-300">
                {t('uploadPrompt')} {/* Use translation */}
              </p>
              <p className="text-xs mt-1 text-gray-500 dark:text-gray-300">
                {t('sizeRecommendation')} {/* Use translation */}
              </p>
            </div>
          )}
        </CldUploadWidget>
      )}
    </div>
  );
}
