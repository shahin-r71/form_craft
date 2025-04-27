"use client";

import { useState } from "react";
import { CldUploadWidget, CldImage } from "next-cloudinary";
import { toast } from "react-toastify";
import Image from "next/image";


const cloudPresetName = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
type coverImgProps ={
    value: string | null | undefined;
    onChange: (imageUrl: string | null) => void;
}

export default function CoverImage({value, onChange}: coverImgProps) {

  

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
            toast.success("Successfully uploaded!", {
              position: "top-center",
              autoClose: 1600,
            });
             widget.close();
          }}
        >
          {({ open }) => (
            <div
              className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center text-gray-500 dark:text-gray-400"
              onClick={() => open()}
            >
              <svg
                className="w-12 h-12 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm text-gray-300">
                Click to upload cover image
              </p>
              <p className="text-xs mt-1 text-gray-500 dark:text-gray-300">
                Recommended size: 1200 x 400px
              </p>
            </div>
          )}
        </CldUploadWidget>
      )}
    </div>
  );
}
