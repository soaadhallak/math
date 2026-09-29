import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Welcome | Admin Panel"
        description="Admin panel home"
      />
      <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-white/[0.03]">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Welcome
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Welcome to Admin Panel.
        </p>
      </div>
    </>
  );
}
