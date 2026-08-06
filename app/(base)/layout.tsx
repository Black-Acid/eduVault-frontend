import Navbar from "~/components/general/navbar";

export default function Base_Layout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}
