import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="text-3xl text-lime-600 font-bold dark:text-white">Hello, world!</h1>
      <p className="mt-4 text-lg">Welcome to my Next.js app!</p>
      <p className="mt-4 text-lg">This is a simple example of a Next.js app.</p>
      <p className="mt-4 text-lg">You can start building your app from here.</p>
      <p className="mt-4 text-lg">Feel free to customize it as you like.</p>
      <p className="mt-4 text-lg">Have fun coding!</p>
      <Button className="my-4">Click me</Button>
      <ThemeToggle />
    </div>
  );
}
