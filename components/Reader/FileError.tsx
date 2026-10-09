export default function FileError({ error }: { error: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="text-center">
        <p className="text-sm text-red-400">{error}</p>

        {/*<p className="mt-2 text-xs text-contrast/50">
            Verifique se o arquivo possui o formato PDF.
          </p>*/}
      </div>
    </div>
  );
}
