"user client"

export default function ErrorMsg({message}:{message:string | undefined}) {
    if (!message) return null;
    return (
      <p className="text-sm text-red-500">
        {message}
      </p>
    );
}