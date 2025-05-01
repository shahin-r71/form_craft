import PopularForms from "@/components/core/popular-forms";
import TemplateGallery from "@/components/core/template-gallery";


export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="py-4 md:py-8 px-6 md:px-24 bg-gray-200">
        <h2 className="p-2 mb-4 font-semibold text-left w-full text-md md:text-2xl">Create new form</h2>
        <TemplateGallery />
      </div>
      <div className="py-4 md:py-8 px-6 md:px-24 bg-gray-50">
        <h2 className="p-2 mb-4 font-semibold text-left w-full text-md md:text-2xl">Popular Forms</h2>
        <PopularForms />
      </div>
    </div>
  );
}
