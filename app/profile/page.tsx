import ProfileClient from "./ProfileClient";

export default function ProfilePage() {
  return (
    <div className="page-container py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">我的收藏</h1>
        <p className="text-sm text-white/60">查看和管理你收藏的资源。</p>
      </div>
      <ProfileClient />
    </div>
  );
}
