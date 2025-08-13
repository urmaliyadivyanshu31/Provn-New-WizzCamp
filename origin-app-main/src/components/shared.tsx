const Label = ({ text }: { text: string }) => (
    <div className="bg-[#FF6D0126] text-[#FF6D01] px-[0.5rem] py-[0.2rem] rounded-sm text-xs font-[400] text-center">
      {text}
    </div>
  );
  
  export const Header = ({
    text,
    label,
    textSize,
  }: {
    text: string;
    label?: string;
    textSize?: string;
  }) => (
    <div className="flex flex-row items-center justify-center gap-4">
      <h1
        className={`text-[#333121] text-center font-[600] ${
          textSize || "text-[32px]"
        }`}
      >
        {text}
      </h1>
      {label && <Label text={label} />}
    </div>
  );
  
  export const Description = ({ text }: { text: string }) => (
    <p className="text-[#4C4536] text-sm text-center font-[400] opacity-70">
      {text}
    </p>
  ); 