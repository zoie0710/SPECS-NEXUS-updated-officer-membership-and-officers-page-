import React, { useEffect, useState } from 'react';
import OfficerSidebar from '../components/OfficerSidebar';
import {
  getOfficers,
  createOfficer,
  updateOfficer,
  deleteOfficer,
  importOfficers,
} from '../services/officerService';
import OfficerModal from '../components/OfficerModal';
import '../styles/AdminManageOfficerPage.css';


const AdminManageOfficerPage = () => {
  const [officers, setOfficers] = useState([]);
  const [selectedOfficerIds, setSelectedOfficerIds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [importFile, setImportFile] = useState(null);

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    try {
      const data = await getOfficers();
      setOfficers(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddNewOfficer = () => {
    setSelectedOfficer(null);
    setShowModal(true);
  };

  const handleEdit = (officer) => {
    setSelectedOfficer(officer);
    setShowModal(true);
  };

  const handleDelete = async (officerId) => {
    if (!window.confirm("Are you sure you want to remove this officer?")) return;
    try {
      await deleteOfficer(officerId);
      fetchOfficers();
    } catch (error) {
      console.error(error);
      alert("Error removing officer");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOfficerIds.length === 0) {
      alert("No officers selected.");
      return;
    }
    if (!window.confirm("Are you sure you want to archive the selected officers?")) return;
    try {
      await Promise.all(selectedOfficerIds.map((id) => deleteOfficer(id)));
      alert("Selected officers archived successfully!");
      fetchOfficers();
      setSelectedOfficerIds([]);
    } catch (error) {
      console.error(error);
      alert("Error archiving selected officers");
    }
  };

  const handleImportChange = (e) => {
    if (e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
    }
  };

  const handleImportOfficers = async () => {
    if (!importFile) {
      alert("Please select an Excel file to import.");
      return;
    }
    try {
      const response = await importOfficers(importFile);
      alert(response.detail || "Officers imported successfully!");
      fetchOfficers();
    } catch (error) {
      console.error(error);
      alert("Error importing officers");
    }
  };

  const handleCheckboxChange = (officerId, isChecked) => {
    if (isChecked) {
      setSelectedOfficerIds(prev => [...prev, officerId]);
    } else {
      setSelectedOfficerIds(prev => prev.filter(id => id !== officerId));
    }
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      const allIds = officers.map(o => o.id);
      setSelectedOfficerIds(allIds);
    } else {
      setSelectedOfficerIds([]);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSave = async (formData, officerId) => {
    try {
      if (officerId) {
        await updateOfficer(officerId, formData);
        alert("Officer updated successfully!");
      } else {
        await createOfficer(formData);
        alert("Officer added successfully!");
      }
      setShowModal(false);
      fetchOfficers();
    } catch (error) {
      console.error(error);
      alert("Error saving officer");
    }
  };

  return (
    <div className="layout-container">
    <OfficerSidebar />
      <div className="main-content">
        <h1>Manage Officers</h1>
        <div className="top-actions">
          <button className="add-officer-btn" onClick={handleAddNewOfficer}>
            ADD NEW OFFICER
          </button>
          <button className="delete-selected-btn" onClick={handleBulkDelete}>
            Delete Selected
          </button>
          <div className="import-section">
            <input type="file" accept=".xls,.xlsx" onChange={handleImportChange} />
            <button onClick={handleImportOfficers}>Import Officers</button>
          </div>
        </div>
        <table className="officers-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={e => handleSelectAll(e.target.checked)}
                  checked={selectedOfficerIds.length === officers.length && officers.length > 0}
                />
              </th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Password</th>
              <th>Student Number</th>
              <th>Year</th>
              <th>Block</th>
              <th>Position</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {officers.map((officer) => (
              <tr key={officer.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedOfficerIds.includes(officer.id)}
                    onChange={e => handleCheckboxChange(officer.id, e.target.checked)}
                  />
                </td>
                <td>{officer.full_name || '-'}</td>
                <td>{officer.email || '-'}</td>
                <td>{officer.password || '-'}</td>
                <td>{officer.student_number || '-'}</td>
                <td>{officer.year || '-'}</td>
                <td>{officer.block || '-'}</td>
                <td>{officer.position || '-'}</td>
                <td>
                  <button onClick={() => handleEdit(officer)}>Edit</button>
                  <button onClick={() => handleDelete(officer.id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <OfficerModal
          show={showModal}
          onClose={handleCloseModal}
          onSave={handleSave}
          initialOfficer={selectedOfficer}
        />
      )}
     </div>
  );
};

export default AdminManageOfficerPage;
