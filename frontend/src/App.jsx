import { useState, useEffect } from 'react'
import { MessageSquare, Heart, Trophy, User as UserIcon, LogIn, Send, X, CornerDownRight, Trash2, Eye, EyeOff, Sparkles, Flame, CheckCircle2 } from 'lucide-react'

const BASE_URL = 'http://127.0.0.1:8000/api'

// --- API Helpers ---
const fetcher = async (url, options = {}) => {
  const res = await fetch(`${BASE_URL}${url}`, options)
  if (!res.ok) throw new Error('API Error')
  if (res.status === 204) return null
  return res.json()
}

// --- Components ---

function Button({ children, onClick, variant = 'primary', className = '', ...props }) {
  const base = "px-5 py-2.5 rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 text-sm tracking-wide"
  const variants = {
    primary: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-lg hover:shadow-indigo-500/40 border border-transparent hover:-translate-y-0.5",
    secondary: "bg-white/80 backdrop-blur-sm text-slate-700 border border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200 shadow-sm hover:shadow-md",
    ghost: "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100/50"
  }
  return <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>
}

// Visual Connector for Nested Comments
const Connector = ({ isLast }) => (
  <div className="absolute top-0 left-4 w-px h-full bg-indigo-100/50 -z-10">
    {!isLast && <div className="absolute top-8 left-0 w-4 h-px bg-indigo-100/50"></div>}
    {isLast && <div className="absolute top-0 left-0 h-4 w-px bg-indigo-100/50"></div>}
  </div>
)

function CommentNode({ comment, depth = 0, onReply, onLike, currentUser, onAuthAction }) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [likes, setLikes] = useState(comment.likes_count)
  const [isLiked, setIsLiked] = useState(comment.is_liked)

  const handleLike = async () => {
    if (!currentUser) {
      onAuthAction((u) => handleLikeAction(u))
      return
    }
    handleLikeAction()
  }

  const handleLikeAction = async (userOverride) => {
    const effectiveUser = userOverride || currentUser
    const prevLikes = likes
    const prevLiked = isLiked
    setLikes(prevLiked ? prevLikes - 1 : prevLikes + 1)
    setIsLiked(!prevLiked)

    try {
      const headers = { 'Authorization': effectiveUser.authHeader }
      await fetcher(`/comments/${comment.id}/like/`, { method: 'POST', headers })
    } catch (e) {
      setLikes(prevLikes)
      setIsLiked(prevLiked)
    }
  }

  const handleSubmitReply = () => {
    if (!currentUser) {
      onAuthAction((u) => {
        onReply(comment.id, replyContent, u)
        setIsReplying(false)
        setReplyContent('')
      })
      return
    }
    onReply(comment.id, replyContent)
    setIsReplying(false)
    setReplyContent('')
  }

  return (
    <div className={`relative flex flex-col ${depth > 0 ? 'ml-6 sm:ml-10' : 'mt-6'}`}>
      {/* Connector Line Logic - Simplified visual for clean look */}
      {depth > 0 && (
         <div className="absolute -left-6 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-200/50 to-transparent block sm:left-[-20px]"></div>
      )}

      <div className={`flex gap-3 sm:gap-4 items-start group rounded-2xl p-3 transition-colors duration-300 ${isReplying ? 'bg-indigo-50/40' : 'hover:bg-slate-50/50'}`}>
        {/* Avatar */}
        <div className="relative">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-400 to-violet-600 rounded-xl p-[2px] shadow-sm flex-shrink-0 cursor-pointer hover:scale-105 transition-transform">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <span className="text-xs sm:text-sm font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-violet-600">
                {comment.author.username[0].toUpperCase()}
              </span>
            </div>
          </div>
          {depth > 0 && <div className="absolute -left-6 top-1/2 w-4 h-px bg-indigo-200/50 hidden sm:block"></div>}
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-white/60 backdrop-blur-sm border border-slate-100/50 rounded-r-2xl rounded-bl-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <span className="font-bold text-slate-800 text-sm cursor-pointer hover:text-indigo-600 transition-colors">
                {comment.author.username}
              </span>
              <span className="text-[10px] text-slate-400 font-medium bg-slate-100/50 px-2 py-0.5 rounded-full">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
            
            <p className="text-slate-600 text-sm mt-1 leading-relaxed break-words">
              {comment.content}
            </p>
          </div>

          <div className="flex items-center gap-4 mt-2 pl-2">
            <button onClick={handleLike} className={`group flex items-center gap-1.5 text-xs font-semibold transition-all ${isLiked ? 'text-pink-500' : 'text-slate-400 hover:text-pink-500'}`}>
              <Heart size={14} className={`transition-transform duration-300 ${isLiked ? 'fill-pink-500 scale-110' : 'group-hover:scale-110'}`} />
              <span>{likes || 'Like'}</span>
            </button>
            
            <button onClick={() => setIsReplying(!isReplying)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors">
              <CornerDownRight size={14} />
              Reply
            </button>
          </div>

          {isReplying && (
            <div className="flex gap-2 items-center mt-3 animate-fade-in">
              <input
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                placeholder={`Reply to ${comment.author.username}...`}
                className="flex-1 bg-white border border-indigo-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400 shadow-sm"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && replyContent && handleSubmitReply()}
              />
              <button
                disabled={!replyContent}
                onClick={handleSubmitReply}
                className="w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-full disabled:opacity-50 disabled:bg-slate-300 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
              >
                <Send size={14} className={replyContent ? "ml-0.5" : ""} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        {comment.replies && comment.replies.map((reply, idx) => (
          <CommentNode 
            key={reply.id} 
            comment={reply} 
            depth={depth + 1} 
            onReply={onReply} 
            onLike={onLike} 
            currentUser={currentUser} 
            onAuthAction={onAuthAction}
          />
        ))}
      </div>
    </div>
  )
}

function PostDetail({ post: initialPost, onClose, currentUser, onAuthAction }) {
  const [post, setPost] = useState(initialPost)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')

  useEffect(() => { loadData() }, [initialPost.id])

  const loadData = async () => {
    setLoading(true)
    try {
      const headers = currentUser ? { 'Authorization': currentUser.authHeader } : {}
      const data = await fetcher(`/posts/${initialPost.id}/`, { headers })
      setPost(data)
      setComments(data.comments || [])
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
  }

  const handlePostLike = async () => {
    if (!currentUser) return onAuthAction((u) => handlePostLikeAction(u))
    handlePostLikeAction()
  }

  const handlePostLikeAction = async (userOverride) => {
    const effectiveUser = userOverride || currentUser
    const prevLikes = post.likes_count
    const prevLiked = post.is_liked
    setPost(p => ({ ...p, likes_count: prevLiked ? prevLikes - 1 : prevLikes + 1, is_liked: !prevLiked }))

    try {
      await fetcher(`/posts/${post.id}/like/`, {
        method: 'POST',
        headers: { 'Authorization': effectiveUser.authHeader }
      })
    } catch (e) { loadData() }
  }

  const handleReplyRequest = (parentId, content, userOverride) => {
    const effectiveUser = userOverride || currentUser
    if (!effectiveUser) return onAuthAction((u) => handleReplyAction(parentId, content, u))
    handleReplyAction(parentId, content, effectiveUser)
  }

  const handleReplyAction = async (parentId, content, userOverride) => {
    try {
      await fetcher(`/posts/${post.id}/comments/`, {
        method: 'POST',
        headers: { 'Authorization': userOverride.authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parent: parentId })
      })
      loadData()
    } catch (e) { console.error(e) }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-end sm:items-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md">
      <div 
        className="bg-[#f8fafc] sm:rounded-3xl rounded-t-3xl shadow-2xl w-full max-w-3xl h-[85vh] sm:h-[90vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-indigo-100 bg-white/80 backdrop-blur-md flex justify-between items-center z-10 sticky top-0">
          <div>
            <h2 className="font-bold text-xl text-slate-800 tracking-tight flex items-center gap-2">
              <MessageSquare className="text-indigo-500" size={24} /> 
              Conversation
            </h2>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 bg-slate-50/50 custom-scrollbar relative"> 
          {/* Main Post Context */}
          <div className="p-6">
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-indigo-50 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[4rem] -z-0"></div>
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <span className="text-white font-bold text-xl">{post.author.username[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{post.author.username}</h3>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{new Date(post.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <p className="text-slate-700 text-lg sm:text-xl leading-relaxed mb-8 relative z-10 font-light">
                {post.content}
              </p>

              <div className="flex gap-4 relative z-10">
                <button 
                  onClick={handlePostLike} 
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${post.is_liked ? 'bg-pink-500 text-white shadow-lg shadow-pink-200' : 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-white hover:border-pink-200 hover:text-pink-500'}`}
                >
                  <Heart size={18} className={post.is_liked ? "fill-white" : ""} />
                  {post.likes_count} Likes
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-8 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-bold text-slate-700 text-lg flex items-center gap-2">
                  Responses <span className="text-slate-400 text-sm font-normal">({comments.reduce((acc, c) => acc + 1 + (c.replies ? checkCount(c.replies) : 0), 0)})</span>
                </h3>
              </div>

               {/* New Comment Input */}
               <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10 blur-sm"></div>
                <div className="bg-white rounded-2xl p-2 border border-indigo-50 shadow-sm flex gap-3">
                   <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="w-full bg-transparent p-3 text-slate-700 placeholder:text-slate-400 focus:outline-none resize-none h-20 sm:h-24 text-sm"
                  />
                  <div className="flex flex-col justify-end pb-2 pr-2">
                     <Button 
                       onClick={() => { handleReplyRequest(null, newComment); setNewComment('') }} 
                       className="w-10 h-10 !p-0 rounded-xl"
                       disabled={!newComment.trim()}
                     >
                       <Send size={18} />
                     </Button>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                   <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                   <span className="text-sm font-medium">Loading thread...</span>
                </div>
              ) : (
                <div className="pb-10">
                  {comments.length === 0 && (
                    <div className="bg-indigo-50/50 rounded-2xl p-8 text-center border border-dashed border-indigo-200">
                      <MessageSquare className="mx-auto text-indigo-300 mb-2" size={32} />
                      <p className="text-slate-500 font-medium">No replies yet.</p>
                      <p className="text-slate-400 text-sm">Be the first to spark the conversation!</p>
                    </div>
                  )}
                  {comments.map(c => (
                    <CommentNode key={c.id} comment={c} onReply={handleReplyRequest} currentUser={currentUser} onAuthAction={onAuthAction} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper for comments count
function checkCount(replies) {
  if (!replies) return 0
  return replies.reduce((acc, r) => acc + 1 + checkCount(r.replies), 0)
}

function FeedItem({ post, onOpen, currentUser, onDelete, onAuthAction }) {
  const [likes, setLikes] = useState(post.likes_count)
  const [isLiked, setIsLiked] = useState(post.is_liked)

  const handleLike = async (e) => {
    e.stopPropagation()
    if (!currentUser) return onAuthAction((u) => handleLikeAction(u))
    handleLikeAction()
  }

  const handleLikeAction = async (userOverride) => {
    const effectiveUser = userOverride || currentUser
    const prevLikes = likes
    const prevLiked = isLiked
    setLikes(prevLiked ? prevLikes - 1 : prevLikes + 1)
    setIsLiked(!prevLiked)

    try {
      const headers = { 'Authorization': effectiveUser.authHeader }
      await fetcher(`/posts/${post.id}/like/`, { method: 'POST', headers })
    } catch (e) {
      setLikes(prevLikes)
      setIsLiked(prevLiked)
    }
  }

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!confirm("Delete this post?")) return
    onDelete(post.id)
  }

  const canDelete = currentUser && (currentUser.username === post.author.username || currentUser.is_staff)

  return (
    <div 
      onClick={onOpen} 
      className="group bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-indigo-100 transition-all duration-300 cursor-pointer relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-50 to-indigo-50/0 rounded-bl-[3rem] -z-0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 group-hover:bg-indigo-50 text-slate-500 group-hover:text-indigo-600 flex items-center justify-center font-bold text-lg transition-colors">
            {post.author.username[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-700 transition-colors">{post.author.username}</h3>
            <p className="text-xs font-semibold text-slate-400">{new Date(post.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        {canDelete && (
          <button onClick={handleDelete} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <p className="text-slate-600 leading-relaxed mb-6 text-[15px] font-normal relative z-10 line-clamp-3">
        {post.content}
      </p>

      <div className="flex items-center gap-3 relative z-10">
        <button onClick={handleLike} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${isLiked ? 'bg-pink-50 text-pink-600' : 'bg-slate-50 text-slate-500 hover:bg-pink-50 hover:text-pink-500'}`}>
          <Heart size={16} className={isLiked ? "fill-current" : ""} />
          {likes}
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
          <MessageSquare size={16} />
          {post.comments_count}
        </button>
      </div>
    </div>
  )
}

function Leaderboard() {
  const [users, setUsers] = useState([])
  useEffect(() => { fetcher('/leaderboard/').then(setUsers).catch(console.error) }, [])

  return (
    <div className="bg-white rounded-[2rem] shadow-lg shadow-indigo-100/50 border border-indigo-50 overflow-hidden sticky top-24">
      <div className="p-6 bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={80} /></div>
        <h3 className="font-black text-xl flex items-center gap-2 relative z-10"><Trophy size={20} className="text-yellow-300" /> Leaderboard</h3>
        <p className="text-xs text-indigo-100 mt-1 opacity-90 relative z-10 font-medium tracking-wide">TOP PERFORMERS (ALL TIME)</p>
      </div>
      
      <div className="p-2">
        {users.length === 0 ? <div className="p-8 text-center text-slate-400 text-sm">No data yet.</div> :
          users.map((u, i) => {
            const isTop3 = i < 3
            const badgeColor = i === 0 ? 'bg-yellow-400 text-yellow-900 ring-4 ring-yellow-100' : i === 1 ? 'bg-slate-300 text-slate-800 ring-4 ring-slate-100' : i === 2 ? 'bg-amber-600 text-amber-100 ring-4 ring-amber-100' : 'bg-slate-100 text-slate-500'
            return (
              <div key={u.username} className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-indigo-50/50 transition-colors cursor-default">
                <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl font-black text-sm shadow-sm ${badgeColor}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-bold text-slate-800 truncate text-sm">{u.username}</span>
                    <span className="font-black text-indigo-600 text-sm">{u.karma}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                     <span className="flex items-center gap-1"><Heart size={10} /> {u.post_likes} Posts</span>
                     <span className="flex items-center gap-1"><MessageSquare size={10} /> {u.comment_likes} Comms</span>
                  </div>
                </div>
              </div>
            )
          })}
      </div>
      <div className="p-4 bg-slate-50 text-center text-[10px] text-slate-400 font-medium uppercase tracking-widest border-t border-slate-100">
        Updated Real-time
      </div>
    </div>
  )
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [activePost, setActivePost] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [guestUsername, setGuestUsername] = useState('')

  useEffect(() => { loadPosts() }, [currentUser])

  const loadPosts = async () => {
    try {
      const headers = currentUser ? { 'Authorization': currentUser.authHeader } : {}
      const data = await fetcher('/posts/', { headers })
      setPosts(data)
    } catch (e) { console.error("Failed to load posts", e) }
  }

  const handleAuthAction = (action) => {
    if (currentUser) action()
    else {
      setPendingAction(() => action)
      setShowAuthModal(true)
    }
  }

  const handleGuestLogin = async (e) => {
    e.preventDefault()
    if (!guestUsername.trim()) return
    try {
      const data = await fetcher('/guest-login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: guestUsername })
      })
      const newUser = { username: data.username, is_staff: data.is_staff, authHeader: data.auth_token }
      setCurrentUser(newUser)
      setShowAuthModal(false)
      if (pendingAction) setTimeout(() => { pendingAction(newUser); setPendingAction(null) }, 100)
    } catch (e) { alert("Try a different name.") }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const authHeader = 'Basic ' + btoa(username + ':' + password)
    try {
      const userDetails = await fetcher('/me/', { headers: { 'Authorization': authHeader } })
      setCurrentUser({ username: userDetails.username, is_staff: userDetails.is_staff, authHeader })
      setShowLogin(false)
    } catch (e) { alert("Invalid Credentials") }
  }

  const handleCreatePost = async (userOverride) => {
    const effectiveUser = userOverride || currentUser
    if (!newPostContent.trim()) return
    try {
      await fetcher('/posts/', {
        method: 'POST',
        headers: { 'Authorization': effectiveUser.authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPostContent })
      })
      setNewPostContent('')
      loadPosts()
    } catch (e) { alert("Failed to post") }
  }

  const handleDeletePost = async (postId) => {
    try {
      await fetcher(`/posts/${postId}/`, { method: 'DELETE', headers: { 'Authorization': currentUser.authHeader } })
      setPosts(posts.filter(p => p.id !== postId))
    } catch (e) { alert("Failed to delete") }
  }

  return (
    <div className="min-h-screen font-sans text-slate-900 pb-20 selection:bg-indigo-500/30">
      {/* Navbar - Glassmorphism */}
      <nav className="fixed top-0 inset-x-0 z-40 px-4 py-4">
        <div className="max-w-6xl mx-auto bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full px-6 h-16 flex items-center justify-between transition-all hover:bg-white/80">
          <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
              <Sparkles size={18} className="fill-white/20" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800 group-hover:text-indigo-600 transition-colors">
              Playto<span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Community</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-4 bg-slate-100/50 pl-4 pr-1.5 py-1.5 rounded-full border border-slate-200/50">
                <span className="text-sm font-semibold text-slate-600 truncate max-w-[100px] sm:max-w-none">
                  {currentUser.username}
                </span>
                <Button variant="secondary" onClick={() => setCurrentUser(null)} className="!py-1.5 !px-4 !text-xs !bg-white">Logout</Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" className="!px-3 !text-slate-600" onClick={() => setShowLogin(true)}>I have an account</Button>
                <Button onClick={() => setShowAuthModal(true)} className="!py-2 !px-5 shadow-indigo-500/20">Join In</Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 pt-32 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar - Intro (Hidden on mobile) */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">
           <div className="bg-white/60 backdrop-blur-sm p-6 rounded-[2rem] border border-white/50 shadow-sm sticky top-24">
             <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
               <Flame className="text-orange-500" size={20} /> Welcome
             </h2>
             <p className="text-slate-500 text-sm leading-relaxed mb-4">
               A specialized community feed for discussing game strategy.
             </p>
             <div className="space-y-3">
               <div className="flex items-center gap-3 text-sm text-slate-600 bg-white/50 p-2 rounded-xl">
                 <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-500 flex items-center justify-center"><Heart size={16} /></div>
                 <span><strong>5 Karma</strong> per post like</span>
               </div>
               <div className="flex items-center gap-3 text-sm text-slate-600 bg-white/50 p-2 rounded-xl">
                 <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center"><MessageSquare size={16} /></div>
                 <span><strong>1 Karma</strong> per match</span>
               </div>
             </div>
           </div>
        </div>

        {/* Center Feed */}
        <div className="lg:col-span-6 space-y-8">
          {/* Create Post Card */}
          <div className="bg-white rounded-[2rem] p-2 shadow-lg shadow-indigo-100/40 border border-white/50 overflow-hidden transform transition-all focus-within:-translate-y-1 focus-within:shadow-xl">
            <div className="p-4 sm:p-6">
               <div className="flex gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0 flex items-center justify-center text-xl font-bold text-slate-400">
                    {currentUser ? currentUser.username[0].toUpperCase() : <UserIcon size={24} />}
                 </div>
                 <div className="flex-1">
                   <textarea
                    rows={2}
                    value={newPostContent}
                    onChange={e => setNewPostContent(e.target.value)}
                    placeholder={currentUser ? `What's happening, ${currentUser.username}?` : "Join the discussion..."}
                    className="w-full bg-transparent text-lg text-slate-800 placeholder:text-slate-300 focus:outline-none resize-none pt-2"
                   />
                 </div>
               </div>
            </div>
            <div className="bg-slate-50/50 p-3 flex justify-between items-center border-t border-slate-100">
               <span className="text-xs font-semibold text-indigo-400 px-4 uppercase tracking-wider">
                 {newPostContent.length > 0 ? 'Writing...' : ''}
               </span>
               <Button onClick={() => handleAuthAction(handleCreatePost)} disabled={!newPostContent} className={`${!newPostContent ? 'opacity-50' : ''}`}>
                 <Send size={16} /> Post Update
               </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-bold text-lg text-slate-700">Latest Discussions</h3>
              <div className="flex gap-2 text-sm text-slate-500 font-medium bg-white px-3 py-1 rounded-full shadow-sm">
                 <span className="text-indigo-600">Hot</span>
                 <span className="text-slate-300">|</span>
                 <span className="hover:text-slate-800 cursor-pointer">New</span>
              </div>
            </div>
            {posts.map(post => (
              <FeedItem
                key={post.id}
                post={post}
                onOpen={() => setActivePost(post)}
                currentUser={currentUser}
                onDelete={handleDeletePost}
                onAuthAction={handleAuthAction}
              />
            ))}
            {posts.length === 0 && (
              <div className="text-center py-20 opacity-50">
                <p>No posts yet. Start the conversation!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Leaderboard */}
        <div className="lg:col-span-3 space-y-6">
          <Leaderboard />
          
          <div className="text-center text-xs text-slate-400 font-medium">
             <p>© 2026 Playto Community prototype</p>
          </div>
        </div>
      </main>

      {/* Auth Modal (Guest) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-sm animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-indigo-50 to-transparent -z-0"></div>
            <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors z-10"><X size={20} /></button>
            
            <div className="text-center mb-8 relative z-10">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-violet-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-200 rotate-3">
                <UserIcon size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-800">Who are you?</h2>
              <p className="text-slate-500 text-sm mt-2 font-medium">Pick a codename to join the fray.</p>
            </div>

            <form onSubmit={handleGuestLogin} className="space-y-4 relative z-10">
              <input
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl px-6 py-4 text-center text-lg font-bold text-indigo-900 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300 placeholder:font-normal"
                placeholder="e.g. Maverick"
                value={guestUsername}
                onChange={e => setGuestUsername(e.target.value)}
                autoFocus
              />
              <Button className="w-full justify-center py-4 text-base rounded-2xl shadow-xl shadow-indigo-500/20">Let me in</Button>
              <div className="text-center pt-2">
                <button type="button" onClick={() => { setShowAuthModal(false); setShowLogin(true); }} className="text-xs text-slate-400 hover:text-indigo-600 font-bold uppercase tracking-wide transition-colors">
                  Login with password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Login Modal (Admin/Staff) */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-sm animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Admin Access</h2>
                <button onClick={() => setShowLogin(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
             </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" value={username} onChange={e => setUsername(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button className="w-full justify-center py-3 mt-2 rounded-xl">Sign In</Button>
            </form>
          </div>
        </div>
      )}

      {activePost && (
        <PostDetail post={activePost} onClose={() => { setActivePost(null); loadPosts() }} currentUser={currentUser} onAuthAction={handleAuthAction} />
      )}
    </div>
  )
}
