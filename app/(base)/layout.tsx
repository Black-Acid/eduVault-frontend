import Navbar from "~/components/general/navbar";

export default function Base_Layout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Navbar />
      <main className="px-4 pt-4">{children}</main>
    </>
  );
}
