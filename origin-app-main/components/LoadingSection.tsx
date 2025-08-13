import Section from "./Section";

const LoadingSection = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => (
  <Section className="flex flex-col items-center justify-center gap-4 max-w-sm">
    <img src="/loading.gif" alt="Loading" className="w-50 -m-4" />
    <h1 className="text-[#333121] text-[25px] font-[600] text-center">
      {title}
    </h1>
    {subtitle && (
      <p className="text-[#4C4536] text-[16px] font-[400] text-center mx-10">
        {subtitle}
      </p>
    )}
    <div className="loader" />
  </Section>
);

export default LoadingSection;
