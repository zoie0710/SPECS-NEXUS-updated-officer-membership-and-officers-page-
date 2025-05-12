import React, { useEffect, useState } from 'react';
import OfficerSidebar from '../components/OfficerSidebar';
import {
  getOfficerMemberships,
  createOfficerMembership,
  updateOfficerMembership,
  verifyOfficerMembership,
  getOfficerRequirements,
  updateOfficerRequirement,
  deleteOfficerRequirement,
  uploadOfficerRequirementQRCode,
  createOfficerRequirement,
  getQRCode
} from '../services/officerMembershipService';
import OfficerMembershipModal from '../components/OfficerMembershipModal';
import '../styles/OfficerManageMembershipPage.css';

const OfficerManageMembershipPage = () => {
  const [officer, setOfficer] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [showQRManagementModal, setShowQRManagementModal] = useState(false);
  const [showAddRequirementModal, setShowAddRequirementModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filterBlock, setFilterBlock] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [filterRequirement, setFilterRequirement] = useState('All');
  const [searchName, setSearchName] = useState('');

  const token = localStorage.getItem('officerAccessToken');

  useEffect(() => {
    const storedOfficer = localStorage.getItem('officerInfo');
    if (storedOfficer) {
      setOfficer(JSON.parse(storedOfficer));
    }
  }, []);

  useEffect(() => {
    async function fetchMemberships() {
      try {
        const data = await getOfficerMemberships(token);
        setMemberships(data);
      } catch (error) {
        console.error("Failed to fetch memberships:", error);
      }
    }
    fetchMemberships();
  }, [token]);

  // Fetch grouped requirements (one record per unique requirement)
  useEffect(() => {
    async function fetchRequirements() {
      try {
        const data = await getOfficerRequirements(token);
        setRequirements(data);
      } catch (error) {
        console.error("Failed to fetch requirements:", error);
      }
    }
    fetchRequirements();
  }, [token]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // For verifying tab: Approve or Deny the payment.
  const handleVerifyAction = async (membershipId, action) => {
    try {
      await verifyOfficerMembership(membershipId, action, token);
      const updated = await getOfficerMemberships(token);
      setMemberships(updated);
      alert(`Membership ${action}d successfully!`);
    } catch (error) {
      console.error("Error updating membership verification:", error);
      alert("Error updating membership verification");
    }
  };

  const handleSave = async (formData, membershipId) => {
    try {
      if (membershipId) {
        await updateOfficerMembership(membershipId, formData, token);
        alert("Membership updated successfully!");
      } else {
        await createOfficerMembership(formData, token);
        alert("Membership created successfully!");
      }
      setShowModal(false);
      const updated = await getOfficerMemberships(token);
      setMemberships(updated);
    } catch (error) {
      console.error("Error saving membership:", error);
      alert("Error saving membership");
    }
  };

  // Handle requirement QR code upload (for the grouped requirement)
  const handleRequirementQRUpload = async (file, paymentType) => {
    if (!selectedRequirement || !selectedRequirement.requirement) {
      console.error("No valid requirement selected for QR upload");
      return;
    }
    try {
      await uploadOfficerRequirementQRCode(selectedRequirement.requirement, paymentType, file, token);
      alert("Requirement QR Code uploaded successfully!");
      const updated = await getOfficerRequirements(token);
      setRequirements(updated);
      setSelectedRequirement(null);
      setShowQRManagementModal(false);
    } catch (error) {
      console.error("Failed to upload requirement QR code:", error);
      alert("Error uploading requirement QR code");
    }
  };

  // Handle requirement update (only update the amount)
  const handleRequirementUpdate = async (amount) => {
    if (!selectedRequirement || !selectedRequirement.requirement) return;
    try {
      await updateOfficerRequirement(selectedRequirement.requirement, { amount }, token);
      alert("Requirement updated successfully!");
      const updated = await getOfficerRequirements(token);
      setRequirements(updated);
      setShowRequirementModal(false);
      setSelectedRequirement(null);
    } catch (error) {
      console.error("Error updating requirement:", error);
      alert("Error updating requirement");
    }
  };

  // Handle requirement archive (delete)
  const handleRequirementArchive = async (requirement) => {
    if (!window.confirm("Are you sure you want to archive this requirement?")) return;
    try {
      await deleteOfficerRequirement(requirement, token);
      alert("Requirement archived successfully!");
      const updated = await getOfficerRequirements(token);
      setRequirements(updated);
    } catch (error) {
      console.error("Error archiving requirement:", error);
      alert("Error archiving requirement");
    }
  };

  // Open the receipt image in a new tab (if needed)
  const openReceiptImage = (url) => {
    const normalizedUrl = url.startsWith("/") ? url : `/${url}`;
    const finalUrl = normalizedUrl.replace(/^\/app\/static/, '/static');
    window.open(`http://localhost:8000${finalUrl}`, '_blank');
  };

  // Filtering logic for the individual memberships table.
  const filteredMemberships = memberships.filter((m) => {
    let statusMatch = true;
    if (activeTab === 'all') {
      statusMatch = true;
    } else if (activeTab === 'verifying') {
      statusMatch =
        (m.payment_status && m.payment_status.toLowerCase() === "verifying") ||
        (m.status && m.status.toLowerCase() === "processing");
    }
    const blockMatch = filterBlock === 'All' ? true : (m.user?.block === filterBlock);
    const yearMatch = filterYear === 'All' ? true : (m.user?.year === filterYear);
    const reqMatch = filterRequirement === 'All' ? true : (m.requirement === filterRequirement);
    const nameMatch = searchName === '' ? true : m.user?.full_name.toLowerCase().includes(searchName.toLowerCase());
    return statusMatch && blockMatch && yearMatch && reqMatch && nameMatch;
  });

  if (!officer) {
    return <div>Loading Officer Info...</div>;
  }

  return (
     <div className="layout-container">
    <OfficerSidebar officer={officer} />
      <div className="main-content">
        <h1>Manage Membership</h1>
              
        {/* Tabs */}
        <div className="events-grid">
        <div className="membership-tabs">
          <button className={activeTab === 'all' ? 'active' : ''} onClick={() => handleTabChange('all')}>
            Members
          </button>
          <button className={activeTab === 'verifying' ? 'active' : ''} onClick={() => handleTabChange('verifying')}>
            Verifying
          </button>
        </div>
        </div>

        
        
        {/* Additional Filters */}
        <div className="additional-filters">
          <div className="filter-item">
            <label>Block:</label>
            <select value={filterBlock} onChange={(e) => setFilterBlock(e.target.value)}>
              <option value="All">All</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>
          <div className="filter-item">
            <label>Year:</label>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
              <option value="All">All</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>
          <div className="filter-item">
            <label>Requirement:</label>
            <select value={filterRequirement} onChange={(e) => setFilterRequirement(e.target.value)}>
              <option value="All">All</option>
              <option value="1st Semester Membership">1st Semester Membership</option>
              <option value="2nd Semester Membership">2nd Semester Membership</option>
            </select>
          </div>
          <div className="filter-item">
            <label>Search Name:</label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Enter full name..."
            />
          </div>
        </div>
        
        {/* Existing Membership Table */}
        <table className="membership-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Block</th>
              <th>Year</th>
              <th>Requirement</th>
              {activeTab === 'verifying' && <th>Receipt Image</th>}
              <th>Status</th>
              {activeTab === 'verifying' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredMemberships.map((m) => (
              <tr key={m.id}>
                <td>{m.user?.full_name || '-'}</td>
                <td>{m.user?.block || '-'}</td>
                <td>{m.user?.year || '-'}</td>
                <td>{m.requirement || '-'}</td>
                {activeTab === 'verifying' && (
                  <td>
                    {m.receipt_path ? (
                      <img
                        src={
                          m.receipt_path.startsWith("http")
                            ? m.receipt_path
                            : `http://localhost:8000${m.receipt_path}`
                        }
                        alt="Receipt"
                        width="50"
                        style={{ cursor: 'pointer' }}
                        onClick={() => openReceiptImage(m.receipt_path)}
                      />
                    ) : (
                      '-'
                    )}
                  </td>
                )}
                <td>{activeTab === 'verifying' ? (m.status || m.payment_status || '-') : m.payment_status || '-'}</td>
                {activeTab === 'verifying' && (
                  <td>
                    <button onClick={() => handleVerifyAction(m.id, 'approve')}>Approve</button>
                    <button onClick={() => handleVerifyAction(m.id, 'deny')}>Deny</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Membership Requirements Section */}
        <div className="requirement-section">
          <h2>Membership Requirements</h2>
          <table className="membership-table">
            <thead>
              <tr>
                <th>Requirement</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((r) => (
                <tr key={`req-${r.id}`}>
                  <td>{r.requirement || '-'}</td>
                  <td>
                    <input
                      type="number"
                      value={r.amount || ''}
                      onChange={(e) =>
                        setSelectedRequirement({ ...r, amount: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <button onClick={() => { setSelectedRequirement(r); setShowRequirementModal(true); }}>
                      Edit Price
                    </button>
                    <button onClick={() => handleRequirementArchive(r.requirement)}>
                      Archive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Buttons for QR Code management and adding requirements */}
          <div className="requirement-management">
            <button
              className="manage-qr-code-btn"
              onClick={() => {
                if (!selectedRequirement && requirements.length > 0) {
                  setSelectedRequirement(requirements[0]);
                }
                setShowQRManagementModal(true);
              }}
            >
              Manage QR Code
            </button>
            <button
              className="add-requirement-btn"
              onClick={() => setShowAddRequirementModal(true)}
            >
              Add Requirement
            </button>
          </div>
        </div>
        
        {/* Officer Membership Modal */}
        <OfficerMembershipModal
          show={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
        
        {/* Modal for Editing Requirement Price */}
        {showRequirementModal && selectedRequirement && (
          <OfficerRequirementModal
            show={showRequirementModal}
            requirementData={selectedRequirement}
            onClose={() => { setShowRequirementModal(false); setSelectedRequirement(null); }}
            onSave={(newAmount) => handleRequirementUpdate(newAmount)}
          />
        )}

        {/* Modal for Managing QR Code */}
        {showQRManagementModal && (
          <OfficerQRManagementModal
            show={showQRManagementModal}
            onClose={() => setShowQRManagementModal(false)}
            onQRUpload={(file, type, req) => {
              setSelectedRequirement(req);
              handleRequirementQRUpload(file, type);
            }}
          />
        )}

        {/* Modal for Adding a Requirement */}
        {showAddRequirementModal && (
          <OfficerAddRequirementModal
            show={showAddRequirementModal}
            onClose={() => setShowAddRequirementModal(false)}
            onSave={async (newReq) => {
              try {
                await createOfficerRequirement(newReq, token);
                alert("Requirement added successfully!");
                const updated = await getOfficerRequirements(token);
                setRequirements(updated);
                setShowAddRequirementModal(false);
              } catch (error) {
                console.error("Error adding requirement:", error);
                alert("Error adding requirement");
              }
            }}
          />
        )}
      </div>
      </div>
  );
};

// Modal for Editing Requirement Price (only editing amount)
const OfficerRequirementModal = ({ show, requirementData, onClose, onSave }) => {
  const [amount, setAmount] = useState(requirementData.amount || '');

  const handleChange = (e) => {
    setAmount(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(amount);
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Edit Requirement: {requirementData.requirement}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Price:</label>
            <input type="number" value={amount} onChange={handleChange} required />
          </div>
          <button type="submit">Save Price</button>
        </form>
      </div>
    </div>
  );
};

// Modal for Managing QR Code – now using logic similar to MembershipModal.js
const OfficerQRManagementModal = ({ show, onClose, onQRUpload }) => {
  const token = localStorage.getItem('officerAccessToken');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedType, setSelectedType] = useState("paymaya");
  const [QRPreviewUrl, setQRPreviewUrl] = useState(null);

  useEffect(() => {
    async function fetchQRCodeData() {
      try {
        const data = await getQRCode(selectedType, token);
        if (data && data.qr_code_url) {
          let url = data.qr_code_url.trim();
          if (!url.startsWith("http")) {
            if (!url.startsWith("/")) {
              url = "/" + url;
            }
            url = `http://localhost:8000${url}`;
          }
          setQRPreviewUrl(url);
        } else {
          setQRPreviewUrl(null);
        }
      } catch (error) {
        console.error("Failed to fetch QR code:", error);
        setQRPreviewUrl(null);
      }
    }
    fetchQRCodeData();
  }, [selectedType, token]);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFile) {
      await onQRUpload(selectedFile, selectedType);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Manage QR Code</h2>
        <div className="qr-code-preview">
          {QRPreviewUrl ? (
            <img src={QRPreviewUrl} alt="QR Code Preview" />
          ) : (
            <p>No QR Code Uploaded</p>
          )}
        </div>
        <div className="form-field">
          <label>Select Payment Type:</label>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="paymaya">PayMaya</option>
            <option value="gcash">GCash</option>
          </select>
        </div>
        <form onSubmit={handleSubmit}>
          <input type="file" accept="image/*" onChange={handleFileChange} required />
          <button type="submit">Upload New QR Code</button>
        </form>
      </div>
    </div>
  );
};

// Modal for Adding a New Requirement
const OfficerAddRequirementModal = ({ show, onClose, onSave }) => {
  const [requirement, setRequirement] = useState("1st Semester Membership");
  const [amount, setAmount] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) return;
    await onSave({ requirement, amount });
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Add Requirement</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Requirement:</label>
            <select value={requirement} onChange={(e) => setRequirement(e.target.value)}>
              <option value="1st Semester Membership">1st Semester Membership</option>
              <option value="2nd Semester Membership">2nd Semester Membership</option>
            </select>
          </div>
          <div className="form-field">
            <label>Amount:</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <button type="submit">Add Requirement</button>
        </form>
      </div>
    </div>
  );
};

export default OfficerManageMembershipPage;
