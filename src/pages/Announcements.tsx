import React, { useState, useEffect } from "react";
import { useAppStore } from "../store";
import api from "../services/api";
import { Announcement, AnnouncementComment } from "../types";

import Layout from "../components/Layout";

export default function Announcements() {
  const user = useAppStore((state) => state.user);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [comments, setComments] = useState<Record<string, AnnouncementComment[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for announcements
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetGroup, setTargetGroup] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);

  // Form state for comments
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // Edit comment state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  useEffect(() => {
    fetchAnnouncements();
    if (user?.role === "instructor" || user?.role === "admin") {
      fetchGroups();
    }
  }, [user]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await api.getAnnouncements(user?.role === "student" ? user.groupName : undefined);
      setAnnouncements(data);
      // Fetch comments for these announcements
      data.forEach(ann => fetchComments(ann.id));
    } catch (err: any) {
      setError(err.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (announcementId: string) => {
    try {
      const data = await api.getAnnouncementComments(announcementId);
      setComments(prev => ({ ...prev, [announcementId]: data }));
    } catch (err) {
      console.error("Failed to load comments for", announcementId, err);
    }
  };

  const fetchGroups = async () => {
    try {
      const users = await api.getUsers();
      const groups = Array.from(new Set(users.map(u => u.groupName).filter(Boolean))) as string[];
      setAvailableGroups(groups);
    } catch (err) {
      console.error("Failed to fetch groups", err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    try {
      setIsSubmitting(true);
      await api.createAnnouncement(title, message, targetGroup);
      setTitle("");
      setMessage("");
      setTargetGroup("all");
      fetchAnnouncements();
    } catch (err: any) {
      setError(err.message || "Failed to create announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await api.deleteAnnouncement(id);
      fetchAnnouncements();
    } catch (err: any) {
      setError(err.message || "Failed to delete announcement");
    }
  };

  const handleCreateComment = async (e: React.FormEvent, announcementId: string) => {
    e.preventDefault();
    const text = commentInputs[announcementId];
    if (!text?.trim()) return;

    try {
      setIsSubmittingComment(announcementId);
      await api.createAnnouncementComment(announcementId, text, replyingTo);
      // Clear input and fetch fresh comments
      setCommentInputs(prev => ({ ...prev, [announcementId]: "" }));
      setReplyingTo(null);
      fetchComments(announcementId);
    } catch (err: any) {
      setError(err.message || "Failed to post comment");
    } finally {
      setIsSubmittingComment(null);
    }
  };

  const handleUpdateComment = async (e: React.FormEvent, commentId: string, announcementId: string) => {
    e.preventDefault();
    if (!editingCommentText.trim()) return;

    try {
      await api.updateAnnouncementComment(commentId, editingCommentText);
      setEditingCommentId(null);
      setEditingCommentText("");
      fetchComments(announcementId);
    } catch (err: any) {
      setError(err.message || "Failed to update comment");
    }
  };

  const handleDeleteComment = async (commentId: string, announcementId: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await api.deleteAnnouncementComment(commentId);
      fetchComments(announcementId);
    } catch (err: any) {
      setError(err.message || "Failed to delete comment");
    }
  };

  const toggleComments = (announcementId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [announcementId]: !prev[announcementId]
    }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-140px)] sm:h-[calc(100vh-120px)] fade-in">
        {/* Header / Title */}
        <div className="flex items-center space-x-3 mb-4 p-4 bg-slate-800/80 rounded-2xl backdrop-blur-xl shadow-md border border-slate-700/50 flex-shrink-0">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full shadow-lg shadow-cyan-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5l-6 4H2v6h3l6 4V5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Announcements</h1>
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Official Channel</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-4 text-sm flex-shrink-0">
            {error}
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-900/60 rounded-2xl border border-slate-700/50 shadow-inner flex flex-col scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {announcements.length === 0 ? (
            <div className="m-auto text-center p-6 bg-slate-800/40 rounded-2xl border border-slate-700/50">
              <p className="text-slate-400">No announcements yet</p>
            </div>
          ) : (
            announcements.slice().reverse().map((announcement) => {
              const isMine = user?.id === announcement.instructor_id;

              return (
                <div key={announcement.id} className={`flex flex-col max-w-[90%] sm:max-w-[75%] ${isMine ? 'self-end' : 'self-start'}`}>
                  <div className={`p-3 sm:p-4 shadow-md group relative ${isMine ? 'bg-slate-800/90 border border-cyan-800/60 shadow-[0_0_15px_-3px_rgba(6,182,212,0.1)] rounded-2xl rounded-tr-sm' : 'bg-slate-800/90 border border-slate-700 rounded-2xl rounded-tl-sm'}`}>

                    <div className="flex justify-between items-baseline mb-1.5 gap-4">
                      <span className={`text-xs sm:text-sm font-bold ${isMine ? 'text-cyan-300' : 'text-emerald-400'}`}>
                        {announcement.instructor?.name || 'Instructor'}
                      </span>
                      <span className="text-[10px] text-slate-400/80 whitespace-nowrap font-medium">
                        {new Date(announcement.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white mb-1.5">{announcement.title}</h3>
                    <div className="text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                      {announcement.message}
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-600/30">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium bg-slate-950/20 px-2 py-0.5 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {announcement.target_group === 'all' ? 'All Students' : announcement.target_group}
                      </span>

                      {(user?.role === "instructor" && isMine) || user?.role === "admin" ? (
                        <button
                          onClick={() => handleDelete(announcement.id)}
                          className="text-slate-400 hover:text-red-400 transition-colors hover:bg-red-400/10 p-1 rounded-md"
                          title="Delete Announcement"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      ) : null}
                    </div>

                    {/* Comments Toggle Button */}
                    <div className="mt-2 text-right">
                      <button
                        onClick={() => toggleComments(announcement.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 px-2.5 py-1 rounded-lg"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {comments[announcement.id]?.length || 0} {comments[announcement.id]?.length === 1 ? 'Comment' : 'Comments'}
                        {expandedComments[announcement.id] ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        )}
                      </button>
                    </div>

                    {/* Comments Section (Collapsible) */}
                    {expandedComments[announcement.id] && (
                      <div className="mt-3 pt-3 border-t border-slate-700/50 animate-fade-in-up origin-top">
                        {/* List Comments */}
                        <div className="space-y-3 mb-3">
                          {comments[announcement.id]?.map((comment) => {
                            const isReply = !!comment.parent_id;
                            const isMyComment = user?.id === comment.user_id;
                            return (
                              <div key={comment.id} className={`flex flex-col ${isReply ? 'ml-6 border-l-2 border-slate-700 pl-3' : ''}`}>
                                <div className="flex justify-between items-start">
                                  <span className={`text-xs font-bold ${isMyComment ? 'text-cyan-300' : 'text-slate-300'}`}>
                                    {comment.user?.name || 'User'}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500">
                                      {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isMyComment && (
                                      <button
                                        onClick={() => {
                                          setEditingCommentId(comment.id);
                                          setEditingCommentText(comment.content);
                                          setReplyingTo(null);
                                        }}
                                        className="text-slate-500 hover:text-cyan-400 p-0.5"
                                        title="Edit comment"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                      </button>
                                    )}
                                    {isMyComment || user?.role === "admin" || (user?.role === "instructor" && isMine) ? (
                                      <button onClick={() => handleDeleteComment(comment.id, announcement.id)} className="text-slate-500 hover:text-red-400 p-0.5" title="Delete comment">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                      </button>
                                    ) : null}
                                  </div>
                                </div>

                                {editingCommentId === comment.id ? (
                                  <form onSubmit={(e) => handleUpdateComment(e, comment.id, announcement.id)} className="mt-1 flex gap-2">
                                    <input
                                      type="text"
                                      autoFocus
                                      value={editingCommentText}
                                      onChange={(e) => setEditingCommentText(e.target.value)}
                                      className="flex-1 bg-slate-900/80 border border-cyan-700/50 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-cyan-500"
                                    />
                                    <button
                                      type="submit"
                                      disabled={!editingCommentText.trim() || editingCommentText === comment.content}
                                      className="text-[10px] font-semibold bg-cyan-600 hover:bg-cyan-500 text-white px-2 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingCommentId(null)}
                                      className="text-[10px] font-semibold text-slate-400 hover:text-slate-300 px-2 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </form>
                                ) : (
                                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{comment.content}</p>
                                )}

                                {!isReply && editingCommentId !== comment.id && (
                                  <button
                                    onClick={() => {
                                      setReplyingTo(replyingTo === comment.id ? null : comment.id);
                                      setEditingCommentId(null);
                                    }}
                                    className="text-[10px] font-semibold text-slate-400 hover:text-cyan-400 self-start mt-1 transition-colors"
                                  >
                                    {replyingTo === comment.id ? 'Cancel Reply' : 'Reply'}
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {/* Comment Input */}
                        <form onSubmit={(e) => handleCreateComment(e, announcement.id)} className="flex gap-2 items-center mt-2 relative">
                          {replyingTo && comments[announcement.id]?.find(c => c.id === replyingTo) && (
                            <div className="absolute -top-6 left-0 text-[10px] text-cyan-400 bg-cyan-900/40 px-2 py-0.5 rounded-t-md">
                              Replying to {comments[announcement.id].find(c => c.id === replyingTo)?.user?.name}
                            </div>
                          )}
                          <input
                            type="text"
                            value={commentInputs[announcement.id] || ""}
                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [announcement.id]: e.target.value }))}
                            placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                            className={`flex-1 bg-slate-900/50 border ${replyingTo ? 'border-cyan-700/50 rounded-b-xl rounded-tr-xl' : 'border-slate-700/50 rounded-xl'} px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500`}
                          />
                          <button
                            type="submit"
                            disabled={isSubmittingComment === announcement.id || !commentInputs[announcement.id]?.trim()}
                            className="p-2 bg-slate-700 hover:bg-cyan-600 text-white rounded-xl transition-colors disabled:opacity-50"
                          >
                            {isSubmittingComment === announcement.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 rotate-90" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                            )}
                          </button>
                        </form>
                      </div>
                    )}

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area for Instructors */}
        {(user?.role === "instructor" || user?.role === "admin") && (
          <div className="mt-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 backdrop-blur-xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] flex-shrink-0">
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-1/2 sm:w-1/3 bg-slate-900/80 border border-slate-600/50 rounded-xl px-4 py-2 text-sm text-white focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-500"
                  placeholder="Subject / Title"
                  required
                />
                <select
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value)}
                  className="w-1/2 sm:w-1/3 bg-slate-900/80 border border-slate-600/50 rounded-xl px-4 py-2 text-sm text-white focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="all">To: All Students</option>
                  {availableGroups.map(group => (
                    <option key={group} value={group}>To: {group}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 items-end">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 bg-slate-900/80 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-500 min-h-[44px] max-h-32 resize-none custom-scrollbar"
                  placeholder="Type an announcement..."
                  rows={Math.max(1, Math.min(4, message.split('\n').length))}
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !message.trim()}
                  className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl shadow-lg shadow-cyan-900/50 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:transform-none flex-shrink-0"
                  title="Send Announcement"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-90" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
}
