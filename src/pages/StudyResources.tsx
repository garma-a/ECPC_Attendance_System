import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import Layout from "../components/Layout";
import { Resource } from "../types";

export default function StudyResources() {
  const queryClient = useQueryClient();

  const [showResourceForm, setShowResourceForm] = useState(false);
  const [resourceFormData, setResourceFormData] = useState({ title: "", description: "", url: "", image_url: "" });
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ['resources'],
    queryFn: () => api.getResources(),
  });

  const createResourceMutation = useMutation({
    mutationFn: (data: { title: string; description?: string; url?: string; image_url?: string; }) => 
      api.createResource(data.title, data.description, data.url, data.image_url),
    onSuccess: () => {
      setShowResourceForm(false);
      setResourceFormData({ title: "", description: "", url: "", image_url: "" });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
    onError: (error: any) => {
      alert("Failed to create resource: " + error.message);
    }
  });

  const updateResourceMutation = useMutation({
    mutationFn: (data: { id: string, updates: Partial<Resource> }) => api.updateResource(data.id, data.updates),
    onSuccess: () => {
      setEditingResource(null);
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
    onError: (error: any) => {
      alert("Failed to update resource: " + error.message);
    }
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (id: string) => api.deleteResource(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resources'] }),
    onError: (error: any) => alert("Failed to delete resource: " + error.message)
  });

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    createResourceMutation.mutate(resourceFormData);
  };

  const handleUpdateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;
    updateResourceMutation.mutate({
      id: editingResource.id,
      updates: {
        title: resourceFormData.title,
        description: resourceFormData.description,
        url: resourceFormData.url,
        image_url: resourceFormData.image_url
      }
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-6">
          Study Resources Map
        </h1>

        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-6 relative z-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-cyan-400">Manage Resources</h2>
            <button
              onClick={() => {
                setShowResourceForm(!showResourceForm);
                setEditingResource(null);
                if (!showResourceForm) {
                  setResourceFormData({ title: "", description: "", url: "", image_url: "" });
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg text-sm sm:text-base"
            >
              {showResourceForm ? "Cancel" : "Add Resource"}
            </button>
          </div>

          {showResourceForm && (
            <div className="mb-6 p-4 bg-slate-900 border border-slate-700 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Add New Resource</h3>
              <form onSubmit={handleCreateResource} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Title *</label>
                  <input
                    type="text"
                    value={resourceFormData.title}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, title: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">URL (Link)</label>
                  <input
                    type="url"
                    value={resourceFormData.url}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, url: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="https://codeforces.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Image URL (Optional)</label>
                  <input
                    type="url"
                    value={resourceFormData.image_url}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, image_url: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="https://example.com/image.png"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                  <textarea
                    value={resourceFormData.description}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    rows={2}
                  />
                </div>
                <button
                  type="submit"
                  disabled={createResourceMutation.isPending}
                  className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all disabled:opacity-50"
                >
                  {createResourceMutation.isPending ? "Publishing..." : "Publish Resource"}
                </button>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.length === 0 && !showResourceForm && (
              <p className="text-slate-400 text-sm col-span-full">No resources published yet.</p>
            )}
            {resources.map((res) => (
              <div key={res.id} className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex flex-col">
                {res.image_url && (
                  <img src={res.image_url} alt={res.title} className="w-full h-32 object-cover rounded-md mb-3" />
                )}
                <h3 className="text-lg font-bold text-cyan-300 break-words">{res.title}</h3>
                {res.description && <p className="text-sm text-slate-400 mt-2 flex-grow break-words">{res.description}</p>}
                
                <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
                  {res.url ? (
                    <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 underline break-all">
                      Visit Link
                    </a>
                  ) : <span />}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingResource(res);
                        setResourceFormData({
                          title: res.title,
                          description: res.description || "",
                          url: res.url || "",
                          image_url: res.image_url || ""
                        });
                      }}
                      className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this resource?')) {
                          deleteResourceMutation.mutate(res.id);
                        }
                      }}
                      disabled={deleteResourceMutation.isPending}
                      className="px-2 py-1 text-xs bg-red-900/50 text-red-300 rounded hover:bg-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editingResource && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 fade-in">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-cyan-400 mb-6">Edit Resource</h3>
            <form onSubmit={handleUpdateResource} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={resourceFormData.title}
                  onChange={(e) => setResourceFormData({ ...resourceFormData, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">URL (Link)</label>
                <input
                  type="url"
                  value={resourceFormData.url}
                  onChange={(e) => setResourceFormData({ ...resourceFormData, url: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  value={resourceFormData.image_url}
                  onChange={(e) => setResourceFormData({ ...resourceFormData, image_url: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={resourceFormData.description}
                  onChange={(e) => setResourceFormData({ ...resourceFormData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end mt-8">
                <button
                  type="button"
                  onClick={() => setEditingResource(null)}
                  className="px-5 py-2.5 bg-slate-700 text-slate-300 font-medium rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateResourceMutation.isPending}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-lg shadow-lg hover:shadow-cyan-500/25 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {updateResourceMutation.isPending && (
                    <div className="h-4 w-4 border-2 border-slate-200 border-t-white rounded-full animate-spin"></div>
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
