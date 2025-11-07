export default function EditOrderPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Edit Order #{params.id}</h1>
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">Order editing functionality coming soon...</p>
      </div>
    </div>
  );
}
