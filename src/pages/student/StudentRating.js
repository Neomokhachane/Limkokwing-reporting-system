import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";
import toast from "../../components/Toast";

function StarRating({ value, onChange, readonly }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`star ${n <= value ? "filled" : "empty"}`}
          onClick={() => !readonly && onChange && onChange(n)}
          style={{ cursor: readonly ? "default" : "pointer" }}
        >
          *
        </span>
      ))}
    </div>
  );
}

export default function StudentRating() {
  const { userProfile } = useAuth();
  const [lecturers, setLecturers] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    rating: 0,
    teaching: 0,
    punctuality: 0,
    comment: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setPageLoading(true);
      try {
        // Get all lecturers
        const usersRef = collection(db, "users");
        const lecturersQuery = userProfile?.faculty
          ? query(usersRef, where("role", "==", "lecturer"), where("faculty", "==", userProfile.faculty))
          : query(usersRef, where("role", "==", "lecturer"));
        const lecturersSnapshot = await getDocs(lecturersQuery);
        const lects = lecturersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        setLecturers(lects);

        setMyRatings([]);
      } catch (error) {
        console.warn("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setPageLoading(false);
      }
    };
    
    fetchData();
  }, [userProfile]);

  const alreadyRated = (lecturerId) => {
    return myRatings.some((r) => r.lecturerId === lecturerId);
  };

  const handleSubmit = async () => {
    // Check if selected exists
    if (!selected) {
      toast.error("No lecturer selected");
      setShowModal(false);
      return;
    }

    const e = {};
    if (!form.rating) e.rating = "Please provide an overall rating";
    if (!form.teaching) e.teaching = "Please rate teaching quality";
    if (!form.punctuality) e.punctuality = "Please rate punctuality";
    
    if (Object.keys(e).length) {
      setErrors(e);
      toast.error("Please complete all rating fields");
      return;
    }
    
    setLoading(true);
    try {
      // Direct Firebase call to add rating
      await addDoc(collection(db, "ratings"), {
        lecturerId: selected.uid,
        lecturerName: selected.name || "Unknown Lecturer",
        lecturerEmail: selected.email || "",
        anonymous: true,
        rating: Number(form.rating),
        teaching: Number(form.teaching),
        punctuality: Number(form.punctuality),
        comment: form.comment || "",
        createdAt: new Date().toISOString()
      });
      
      setMyRatings((items) => [
        ...items,
        {
          lecturerId: selected.uid,
          anonymous: true,
          rating: Number(form.rating),
          teaching: Number(form.teaching),
          punctuality: Number(form.punctuality),
          comment: form.comment || "",
          createdAt: new Date().toISOString(),
        },
      ]);
      
      toast.success("Rating submitted successfully!");
      setShowModal(false);
      setForm({ rating: 0, teaching: 0, punctuality: 0, comment: "" });
      setErrors({});
      setSelected(null);
    } catch (error) {
      console.warn("Error submitting rating:", error);
      toast.error("Failed to submit rating: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openRatingModal = (lecturer) => {
    setSelected(lecturer);
    setForm({ rating: 0, teaching: 0, punctuality: 0, comment: "" });
    setErrors({});
    setShowModal(true);
  };

  const filtered = lecturers.filter(
    (l) =>
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.faculty?.toLowerCase().includes(search.toLowerCase())
  );

  if (pageLoading) {
    return (
      <Layout title="Rate Lecturers">
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <span>Loading lecturers...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Rate Lecturers">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rate Lecturers</h1>
          <p className="page-subtitle">Provide feedback on your lecturers</p>
        </div>
      </div>
      
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="search-bar">
          <span>Search</span>
          <input
            placeholder="Search lecturers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer" }}>
              Clear
            </button>
          )}
        </div>
      </div>
      
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">No Lecturers</div>
          <h3>No lecturers found</h3>
          <p>No lecturers are available for your faculty yet</p>
        </div>
      ) : (
        <div className="grid-2" style={{ gap: 16 }}>
          {filtered.map((l) => {
            const rated = alreadyRated(l.uid);
            const myRating = myRatings.find((r) => r.lecturerId === l.uid);
            return (
              <div key={l.uid} className="card">
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <div className="user-avatar" style={{ width: 48, height: 48, fontSize: 18 }}>
                    {(l.name || "L")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{l.name}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>{l.faculty}</div>
                  </div>
                </div>
                
                {rated && myRating ? (
                  <div>
                    <div style={{ marginBottom: 10 }}>
                      <div className="text-muted" style={{ marginBottom: 4, fontSize: 12 }}>
                        Your Rating
                      </div>
                      <StarRating value={myRating.rating} readonly />
                    </div>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 12 }}>
                        Teaching: <StarRating value={myRating.teaching} readonly />
                      </div>
                      <div style={{ fontSize: 12 }}>
                        Punctuality: <StarRating value={myRating.punctuality} readonly />
                      </div>
                    </div>
                    {myRating.comment && (
                      <div className="text-muted" style={{ marginTop: 8, fontSize: 13, fontStyle: "italic" }}>
                        "{myRating.comment}"
                      </div>
                    )}
                    <span className="badge badge-green" style={{ marginTop: 10 }}>
                      Already Rated
                    </span>
                  </div>
                ) : (
                  <button
                    className="btn btn-primary"
                    style={{ width: "100%" }}
                    onClick={() => openRatingModal(l)}
                  >
                    Rate This Lecturer
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && selected && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Rate {selected.name}</h3>
              <button className="btn btn-icon btn-secondary" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Overall Rating *</label>
                <StarRating
                  value={form.rating}
                  onChange={(v) => {
                    setForm((f) => ({ ...f, rating: v }));
                    setErrors((e) => ({ ...e, rating: "" }));
                  }}
                />
                {errors.rating && <div className="form-error">{errors.rating}</div>}
              </div>
              
              <div className="form-group">
                <label className="form-label">Teaching Quality *</label>
                <StarRating
                  value={form.teaching}
                  onChange={(v) => {
                    setForm((f) => ({ ...f, teaching: v }));
                    setErrors((e) => ({ ...e, teaching: "" }));
                  }}
                />
                {errors.teaching && <div className="form-error">{errors.teaching}</div>}
              </div>
              
              <div className="form-group">
                <label className="form-label">Punctuality *</label>
                <StarRating
                  value={form.punctuality}
                  onChange={(v) => {
                    setForm((f) => ({ ...f, punctuality: v }));
                    setErrors((e) => ({ ...e, punctuality: "" }));
                  }}
                />
                {errors.punctuality && <div className="form-error">{errors.punctuality}</div>}
              </div>
              
              <div className="form-group">
                <label className="form-label">Comment (optional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Share your feedback about this lecturer..."
                  value={form.comment}
                  onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <span className="loading-spinner" style={{ width: 16, height: 16 }} />
                ) : (
                  "Submit Rating"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
