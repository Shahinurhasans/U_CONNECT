import React, { useState, useRef, useEffect } from "react";
import api from "../api/axios";
import { FaSave, FaTimes, FaEllipsisV, FaComment, FaShare, FaThumbsUp  } from "react-icons/fa";
import { DateTime } from "luxon";
import { useAuth } from "../context/AuthContext";
import ShareBox from "./ShareBox"; // Import the ShareBox component
import PropTypes from "prop-types";
import { TimeAgo } from "../utils/TimeUtils";
import UsernameLink from "./AboutMe/UsernameLink";


const Post =  React.forwardRef(({ post, onUpdate, onDelete, id }, ref) => {
  const { user } = useAuth();
  const { post_type, created_at, user: postUser, event } = post ;

  useEffect(() => {
    fetchComments();
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [sharing, setSharing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedContent, setUpdatedContent] = useState(post?.content || "");
  const menuRef = useRef(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [updatedMedia, setUpdatedMedia] = useState(null);
  const [updatedDocument, setUpdatedDocument] = useState(null);
  const [UpdatedeventTitle, setUpdatedeventTitle] = useState(event?.title || "");
  const [UpdatedeventDescription, setUpdatedeventDescription] = useState(event?.description || "");
  const [UpdatedeventDate, setUpdatedeventDate] = useState(event?.event_date || "");
  const [UpdatedeventTime, setUpdatedeventTime] = useState(event?.event_time || "");
  const [Updatedlocation, setUpdatedlocation] = useState(event?.location || "");
  const [liked, setLiked] = useState(post?.user_liked);
  const [likes, setLikes] = useState(post?.total_likes);
  const [comments, setComments] = useState([]);
  const [shareLink, setShareLink] = useState("");
  const [commentText, setCommentText] = useState(""); // Comment input text state
  const [replyText, setReplyText] = useState(""); // Reply input text state
  const [replyingTo, setReplyingTo] = useState(null); // Track which comment the user is replying to
  const [commenting, setCommenting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showShareBox, setShowShareBox] = useState(false);


  if (!post?.user) {
    return <div>Loading...</div>; // Or a skeleton loader
  }
  
  Post.propTypes = {
    post: PropTypes.shape({
      id: PropTypes.number.isRequired, // Adjust type based on your data (number or string)
      user: PropTypes.shape({
        // Define the structure of the user object here
        username: PropTypes.string.isRequired, // Add username validation
        id: PropTypes.number.isRequired,  // Example: user should have an 'id' property
        profile_picture: PropTypes.string, // Add profile_picture validation
        // Add other properties if needed
      }).isRequired,
      content: PropTypes.string.isRequired,
      user_liked: PropTypes.bool,
      total_likes: PropTypes.number,
      created_at: PropTypes.string.isRequired, // Or PropTypes.instanceOf(Date) if using Date object
      post_type: PropTypes.string.isRequired,
      media_url: PropTypes.string,
      document_url: PropTypes.string,
      event: PropTypes.shape({
        title: PropTypes.string,
        description: PropTypes.string,
        event_date: PropTypes.string,
        event_time: PropTypes.string,
        location: PropTypes.string,
        event_datetime: PropTypes.string, // Add event_datetime validation
      }),
    }).isRequired,
    onUpdate: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    id: PropTypes.string.isRequired, // Add validation for the 'id' prop
  };
  
  const isOwner = user?.id === postUser?.id;
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Detect user's local timezone
  const postDateUTC = DateTime.fromISO(created_at, { zone: "utc" }); // Parse as UTC
  
  const postDateLocal = postDateUTC.setZone(userTimezone); // Convert to user's local timezone
  
  // ✅ Fix: Use `.toMillis()` instead of `.getTime()`
  const timeDiffMinutes = Math.floor((Date.now() - postDateLocal.toMillis()) / 60000);
  
  let timeAgo;
  if (timeDiffMinutes < 1) {
    timeAgo = "Just now";
  } else if (timeDiffMinutes < 60) {
    timeAgo = `${timeDiffMinutes} min ago`;
  } else if (timeDiffMinutes < 1440) {
    timeAgo = `${Math.floor(timeDiffMinutes / 60)} hours ago`;
  } else {
    timeAgo = `${Math.floor(timeDiffMinutes / 1440)} days ago`;
  }
  
  

  
  

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const response = await api.get(`/interactions/${post.id}/comments`);
      setComments(response.data.comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
    setLoadingComments(false);
  };



  const handleEdit = async () => {
    try {
      let res;
      
      if (post_type === "text") {
        // Only update text content
        res = await api.put(`/posts/update_text_post/${post.id}/`, { content: updatedContent });
      } 
      else if (post_type === "media") {
        const formData = new FormData();
        if (updatedContent) formData.append("content", updatedContent);
        if (updatedMedia) formData.append("media_file", updatedMedia);
        
        res = await api.put(`/posts/update_media_post/${post.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } 
      else if (post_type === "document") {
        const formData = new FormData();
        if (updatedContent) formData.append("content", updatedContent);
        if (updatedDocument) formData.append("document_file", updatedDocument);
  
        res = await api.put(`/posts/update_document_post/${post.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      else if (post_type === "event") {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const formData = new FormData();
        formData.append("event_title", UpdatedeventTitle);
        formData.append("event_description", UpdatedeventDescription);
        formData.append("event_date", UpdatedeventDate);
        formData.append("event_time", UpdatedeventTime);
        formData.append("user_timezone", userTimezone);
        formData.append("location", Updatedlocation);
        res = await api.put(`/posts/update_event_post/${post.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      onUpdate(res.data);
      setIsEditing(false);
      // Update state after successful API call
      
    } catch (error) {
      console.error("❌ Error updating post:", error);
    }
    
  };
  
  
  const handleDelete = async () => {
    try {
      await api.delete(`/posts/delete_post/${post.id}/`);
      onDelete(post.id); // Remove post from state
    } catch (error) {
      console.error("❌ Error deleting post:", error);
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleLike = async (postId, commentId = null) => {
    // Optimistic UI update
    setLiked((prevLiked) => !prevLiked);
    setLikes((prevLikes) => (liked ? prevLikes - 1 : prevLikes + 1));
  
    try {
      const response = await api.post(`/interactions/like`, { post_id: postId, comment_id: commentId });
  
      // Backend confirmed state (if needed for accuracy)
      setLikes(response.data.total_likes);
      setLiked(response.data.user_liked);
    } catch (error) {
      console.error("Error liking post:", error);
  
      // Revert UI in case of an error
      setLiked((prevLiked) => !prevLiked);
      setLikes((prevLikes) => (liked ? prevLikes + 1 : prevLikes - 1));
    }
  };

  const handleAddComment = async (postId, content) => {
    try {
      const response = await api.post(`/interactions/${postId}/comment`, {
        post_id: postId,
        content: content,
        parent_id: null, // No parent for root comments
      });

      if (response.status === 200){
        fetchComments();
        TimeAgo();
        setCommentText("");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleAddReply = async (postId, parentCommentId, content) => {
    try {
      const response = await api.post(`/interactions/${postId}/comment/${parentCommentId}/reply`, {
        post_id: postId,
        content: content,
        parent_id: parentCommentId,
      });
      if (response.status === 200){
        fetchComments();
        TimeAgo();
        setReplyText(""); // Clear reply input
        setReplyingTo(null); // Close reply input
      }
      
      
    } catch (error) {
      console.error("Error adding reply:", error);
    }
  };

  
  const handleShare = async () => {
      setSharing(true);
      try {
        const response = await api.post(`/interactions/${post.id}/share/`, {
          post_id: post.id, // ✅ Send post_id in request body
        });
        setShareLink(response.data.share_link);
        setShowShareBox(true);
      } catch (error) {
        console.error("Error sharing post:", error);
      }
      setSharing(false);
  };


return (
  <div ref={ref} id={id} className="bg-white shadow-md rounded-lg p-4 mb-4 relative">
    
    {/* Post Header */}
    <div className="flex justify-between items-center mb-3">
      <div className="flex items-center">
        <img
          src={postUser.profile_picture}
          alt="Profile"
          className="w-10 h-10 rounded-full mr-3"
        />
        <div>
          <h3 className="font-semibold"><UsernameLink username={postUser.username} /></h3>
          <p className="text-xs font-medium text-gray-500">{postUser.university_name}</p>
          <p className="text-xs text-gray-500">{timeAgo}</p>
        </div>
      </div>

      {/* Post Menu */}
      <div className="relative" ref={menuRef}>
        <button
          className="text-gray-600 hover:text-gray-800 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <FaEllipsisV />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white border shadow-lg rounded-lg p-2">
            {isOwner ? (
              <>
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsEditing(true)}
                >
                  ✏ Edit Post
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100"
                  onClick={() => setShowDeleteModal(true)}
                >
                  🗑 Delete Post
                </button>
              </>
            ) : (
              <button className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
                🚩 Report Post
              </button>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Post Content */}
    {isEditing ? (
      <div>
        <textarea
          value={updatedContent}
          onChange={(e) => setUpdatedContent(e.target.value)}
          className="border p-2 rounded w-full mb-2"
        ></textarea>

        {post.post_type === "media" && (
          <input
            type="file"
            accept="image/*,video/*"
            className="mb-2 w-full"
            onChange={(e) => setUpdatedMedia(e.target.files[0])}
          />
        )}

        {post.post_type === "document" && (
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            className="mb-2 w-full"
            onChange={(e) => setUpdatedDocument(e.target.files[0])}
          />
        )}

        {post.post_type === "event" && (
          <div className="space-y-2">
            <input
              type="text"
              value={UpdatedeventTitle}
              onChange={(e) => setUpdatedeventTitle(e.target.value)}
              placeholder="Event Title *"
              className="border p-2 rounded w-full"
            />
            <textarea
              value={UpdatedeventDescription}
              onChange={(e) => setUpdatedeventDescription(e.target.value)}
              placeholder="Event Description *"
              className="border p-2 rounded w-full"
            ></textarea>
            <input
              type="date"
              value={UpdatedeventDate}
              onChange={(e) => setUpdatedeventDate(e.target.value)}
              className="border p-2 rounded w-full"
            />
            <input
              type="time"
              value={UpdatedeventTime}
              onChange={(e) => setUpdatedeventTime(e.target.value)}
              className="border p-2 rounded w-full"
            />
            <input
              type="text"
              value={Updatedlocation}
              onChange={(e) => setUpdatedlocation(e.target.value)}
              placeholder="Location"
              className="border p-2 rounded w-full"
            />
          </div>
        )}

<div className="flex justify-between mt-4 mx-4">
  <button
    onClick={handleEdit}
    className="flex items-center gap-2 px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition duration-200"
  >
    Save
  </button>
  <button
    onClick={() => setIsEditing(false)}
    className="flex items-center gap-2 px-8 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl shadow-md transition duration-200"
  >
    Cancel
  </button>
</div>
      </div>
    ) : (
      <div>
        <p className="whitespace-pre-line">{post.content}</p>
        {post.post_type === "media" && post.media_url && (
          <img
            src={post.media_url}
            alt="Media"
            className="w-full mt-2 rounded"
          />
        )}
        {post.post_type === "document" && post.document_url && (
          <div className="mt-4 rounded-xl border border-gray-300 shadow-sm overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700">Document Preview</h2>
            <a
              href={post.document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 text-sm font-semibold hover:underline"
            >
              Open in new tab
            </a>
          </div>
          <iframe
            src={post.document_url}
            width="100%"
            height="500px"
            title="Document Viewer"
            className="w-full border-none"
          ></iframe>
        </div>
        )}
        {post.post_type === "event" && event && (
          <div>
            <h3 className="font-bold text-lg">{event.title}</h3>
            <p className="text-sm text-gray-600">{event.description}</p>
            <p className="text-sm text-gray-500">📍 {event.location}</p>
            <p className="text-sm text-gray-500">
              🗓 {new Date(event.event_datetime).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    )}

    {/* Like, Comment, Share Section */}
    <div className="flex items-center justify-between mt-3 space-x-4">
      <div className="flex items-center space-x-1">
        <span className="text-gray-700">{likes} {likes === 1 ? "Like" : "Likes"}</span>
        <button
          onClick={() => handleLike(post.id)}
          className="flex items-center text-gray-700"
        >
          {liked ? <FaThumbsUp className="text-blue-600" /> : <FaThumbsUp className="text-gray-600" />}
        </button>
      </div>

      <button
        onClick={() => setCommenting(true)}
        className="flex items-center text-gray-700"
      >
        <FaComment className="text-gray-500" />
        <span className="ml-1">Comment</span>
      </button>

      <button
        onClick={handleShare}
        className={`flex items-center ${sharing ? "text-gray-400 cursor-not-allowed" : "text-gray-700"}`}
        disabled={sharing}
      >
        <FaShare />
        <span className="ml-1">{sharing ? "Sharing..." : "Share"}</span>
      </button>

      {showShareBox && (
        <ShareBox shareLink={shareLink} onClose={() => setShowShareBox(false)} />
      )}


    </div>

    {/* Comment Section */}
    {commenting && (
      <div className="mt-4">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Write a comment..."
          className="w-full p-2 mt-2 border border-gray-300 rounded-md"
        />
        <button
          onClick={() => handleAddComment(post.id, commentText)}
          className="mt-2 bg-blue-500 text-white p-2 rounded-md"
        >
          Submit Comment
        </button>
      </div>
    )}

    {/* Render Comments */}
    <div className="mt-4">
      {loadingComments ? (
        <p>Loading comments...</p> // Show loading indicator
      ) : (
        comments.map((comment) => (
          <div key={comment.id} className="ml-4 mb-2">
            {/* Parent Comment */}
            <div className="flex items-start space-x-2">
              <img
                src={comment.user.profile_picture}
                alt={comment.user.username}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex justify-between w-full">
                <div>
                  <p>
                    <strong>{comment.user.username}:</strong> {comment.content}
                  </p>
                  <p className="text-sm text-gray-500">
                    {TimeAgo(comment.created_at)} {/* Function to calculate time ago */}
                  </p>
                </div>               
              </div>
            </div>

            {/* Render Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="ml-8 mt-4">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="flex items-start space-x-2">
                    <img
                      src={reply.user.profile_picture}
                      alt={reply.user.username}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p>
                        <strong>{reply.user.username}:</strong> {reply.content}
                      </p>
                      <p className="text-sm text-gray-500">
                        {TimeAgo(reply.created_at)} {/* Function to calculate time ago */}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setReplyingTo(comment.id)} className="text-blue-500 text-sm">
              Reply
            </button>

            {/* Reply Input */}
            {replyingTo === comment.id && (
              <div className="mt-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full p-2 mt-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={() => handleAddReply(post.id, comment.id, replyText)}
                  className="mt-2 bg-blue-500 text-white p-2 rounded-md"
                >
                  Submit Reply
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>


    {/* Delete Confirmation Modal */}
    {showDeleteModal && (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-5 rounded-lg shadow-lg w-96">
          <h2 className="text-lg font-semibold mb-4">Are you sure?</h2>
          <p>Do you really want to delete this post? This action cannot be undone.</p>
          <div className="flex justify-end mt-4 space-x-2">
            <button className="bg-gray-500 text-white px-4 py-2 rounded" onClick={() => setShowDeleteModal(false)}>Cancel</button>
            <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={handleDelete}>Yes, Delete</button>
          </div>
        </div>
      </div>
    )}
    

  </div>
  );

});

export default Post;
