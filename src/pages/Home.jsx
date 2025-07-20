import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Award } from 'lucide-react';
import { exportToPDF } from '../utils/pdfGenerator'; // <-- 1. Impor fungsi PDF
import '../styles/Home.css';
import api from '../services/api';

const Home = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  const [newEmployee, setNewEmployee] = useState({
    nama: '',
    kinerja: 0,
    kreativitas: 0,
    inovasi: 0,
    absensi: 0,
    kedisiplinan: 0,
    perilaku: 0,
    photo: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error("Gagal mengambil data dari API:", error);
      setEmployees([]);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    if (loggedIn !== "true") {
      navigate("/");
    } else {
      fetchData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const addEmployee = async () => {
    try {
      await api.post('/employees', newEmployee);
      setIsAddingEmployee(false);
      setNewEmployee({ nama: '', kinerja: 0, kreativitas: 0, inovasi: 0, absensi: 0, kedisiplinan: 0, perilaku: 0, photo: '' });
      fetchData();
    } catch (error) {
      console.error("Gagal menambah karyawan:", error);
    }
  };

  const updateEmployee = async () => {
    try {
      await api.put(`/employees/${editingEmployee.id}`, editingEmployee);
      setEditingEmployee(null);
      fetchData();
    } catch (error) {
      console.error("Gagal mengupdate karyawan:", error);
    }
  };

  const deleteEmployee = async (id) => {
    try {
      await api.delete(`/employees/${id}`);
      setShowDeleteConfirm(null);
      fetchData();
    } catch (error) {
      console.error("Gagal menghapus karyawan:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("token");
    navigate("/");
  };
  
  const criteria = useMemo(() => ({
    kinerja: { weight: 0.4083, type: 'benefit', label: 'Kinerja' },
    kreativitas: { weight: 0.2417, type: 'benefit', label: 'Kreativitas' },
    inovasi: { weight: 0.1583, type: 'benefit', label: 'Inovasi' },
    absensi: { weight: 0.1083, type: 'cost', label: 'Absensi' },
    kedisiplinan: { weight: 0.0617, type: 'cost', label: 'Kedisiplinan' },
    perilaku: { weight: 0.0278, type: 'cost', label: 'Perilaku' }
  }), []);

  const benefitCriteria = useMemo(() => Object.keys(criteria).filter(key => criteria[key].type === 'benefit'), [criteria]);
  const costCriteria = useMemo(() => Object.keys(criteria).filter(key => criteria[key].type === 'cost'), [criteria]);

  const normalizedMatrix = useMemo(() => {
    if (!employees.length) return [];
    const maxValues = {};
    const minValues = {};
    [...benefitCriteria, ...costCriteria].forEach(crit => {
      maxValues[crit] = Math.max(...employees.map(emp => emp[crit] || 0));
      minValues[crit] = Math.min(...employees.map(emp => emp[crit] || 0));
    });
    return employees.map(employee => {
      const normalizedValues = { id: employee.id, nama: employee.nama, photo: employee.photo };
      benefitCriteria.forEach(key => normalizedValues[key] = maxValues[key] ? (employee[key] / maxValues[key]) : 0);
      costCriteria.forEach(key => normalizedValues[key] = employee[key] ? (minValues[key] / employee[key]) : 0);
      return normalizedValues;
    });
  }, [employees, benefitCriteria, costCriteria]);

  const finalScores = useMemo(() => {
    if (!normalizedMatrix.length) return [];
    const scores = normalizedMatrix.map(normEmployee => {
      let totalScore = 0;
      Object.keys(criteria).forEach(key => {
        totalScore += criteria[key].weight * (normEmployee[key] || 0);
      });
      return {
        id: normEmployee.id,
        nama: normEmployee.nama,
        photo: normEmployee.photo,
        score: totalScore,
        criteriaScores: Object.keys(criteria).reduce((acc, key) => {
          acc[key] = criteria[key].weight * (normEmployee[key] || 0);
          return acc;
        }, {})
      };
    });
    const sortedScores = [...scores].sort((a, b) => b.score - a.score);
    return sortedScores.map((score, index) => ({ ...score, rank: index + 1 }));
  }, [normalizedMatrix, criteria]);

  const chartData = useMemo(() => {
    return finalScores.map(score => ({
      name: score.nama,
      ...score.criteriaScores,
      total: score.score
    }));
  }, [finalScores]);

  const formatNumber = (num) => Number(num).toFixed(3);

  // 2. Fungsi handle untuk memanggil fungsi ekspor dengan data yang relevan
  const handleExportClick = () => {
    exportToPDF(finalScores, normalizedMatrix, criteria, benefitCriteria, costCriteria);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Memuat data karyawan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1 className="header-title">Sistem Pendukung Keputusan <br /> Karyawan Terbaik</h1>
        <h3 className="header-company">PT Mandom Indonesia Tbk — Bekasi</h3>
        <p className="header-description">
          Menggunakan Metode <strong>Simple Additive Weighting (SAW)</strong>
        </p>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="tabs">
        <button className={`tab-button ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>Home</button>
        <button className={`tab-button ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => setActiveTab('employees')}>Data Karyawan</button>
        <button className={`tab-button ${activeTab === 'normalized' ? 'active' : ''}`} onClick={() => setActiveTab('normalized')}>Matriks Normalisasi</button>
        <button className={`tab-button ${activeTab === 'final' ? 'active' : ''}`} onClick={() => setActiveTab('final')}>Hasil Akhir</button>
        <button className={`tab-button ${activeTab === 'chart' ? 'active' : ''}`} onClick={() => setActiveTab('chart')}>Visualisasi</button>
        <button className={`tab-button ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>Informasi Metode</button>
      </div>

      <div className="content-panel">
        {activeTab === 'home' && (
          <div className="home-tab-content">
            <h2>Selamat Datang di Sistem Pendukung Keputusan Karyawan Terbaik</h2>
            <h2>PT. Mandom Indonesia Tbk</h2>
            <p>Gunakan menu di atas untuk mengakses data dan fitur.</p>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="tab-content">
            <h3 className="section-title">Data Penilaian Karyawan</h3>
            <div className="manual-actions">
              <button onClick={() => setIsAddingEmployee(true)} className="manual-button add">Tambah Karyawan</button>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="table-header" rowSpan="2">Foto</th>
                    <th className="table-header" rowSpan="2">Nama</th>
                    <th className="table-header text-center" colSpan="3">Kriteria Benefit</th>
                    <th className="table-header text-center" colSpan="3">Kriteria Cost</th>
                    <th className="table-header" rowSpan="2">Aksi</th>
                  </tr>
                  <tr>
                    {benefitCriteria.map(key => (<th key={key} className="table-header text-center">{criteria[key].label}<br />({criteria[key].weight})</th>))}
                    {costCriteria.map(key => (<th key={key} className="table-header text-center">{criteria[key].label}<br />({criteria[key].weight})</th>))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="table-row">
                      <td className="table-cell"><img src={employee.photo || 'https://via.placeholder.com/40'} alt={employee.nama} className="employee-photo" /></td>
                      <td className="table-cell font-medium">{employee.nama}</td>
                      {benefitCriteria.map(key => (<td key={key} className="table-cell text-center">{employee[key]}</td>))}
                      {costCriteria.map(key => (<td key={key} className="table-cell text-center">{employee[key]}</td>))}
                      <td className="table-cell">
                        <div className="action-buttons">
                          <button onClick={() => setEditingEmployee({ ...employee })} className="action-button edit">Edit</button>
                          <button onClick={() => setShowDeleteConfirm(employee.id)} className="action-button delete">Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {isAddingEmployee && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Tambah Karyawan Baru</h3>
              <div className="form-group"><label>Nama:</label><input type="text" value={newEmployee.nama} onChange={(e) => setNewEmployee({ ...newEmployee, nama: e.target.value })}/></div>
              {Object.keys(criteria).map(key => (<div className="form-group" key={key}><label>{criteria[key].label}:</label><input type="number" value={newEmployee[key]} onChange={(e) => setNewEmployee({ ...newEmployee, [key]: parseFloat(e.target.value) || 0 })}/></div>))}
              <div className="form-group"><label>URL Foto:</label><input type="text" value={newEmployee.photo} onChange={(e) => setNewEmployee({ ...newEmployee, photo: e.target.value })}/></div>
              <div className="modal-buttons">
                <button onClick={() => setIsAddingEmployee(false)}>Batal</button>
                <button onClick={addEmployee}>Simpan</button>
              </div>
            </div>
          </div>
        )}

        {editingEmployee && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Edit Karyawan</h3>
              <div className="form-group"><label>Nama:</label><input type="text" value={editingEmployee.nama} onChange={(e) => setEditingEmployee({ ...editingEmployee, nama: e.target.value })}/></div>
              {Object.keys(criteria).map(key => (<div className="form-group" key={key}><label>{criteria[key].label}:</label><input type="number" value={editingEmployee[key]} onChange={(e) => setEditingEmployee({ ...editingEmployee, [key]: parseFloat(e.target.value) || 0 })}/></div>))}
              <div className="form-group"><label>URL Foto:</label><input type="text" value={editingEmployee.photo} onChange={(e) => setEditingEmployee({ ...editingEmployee, photo: e.target.value })}/></div>
              <div className="modal-buttons">
                <button onClick={() => setEditingEmployee(null)}>Batal</button>
                <button onClick={updateEmployee}>Simpan</button>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Konfirmasi Hapus</h3>
              <p>Apakah Anda yakin ingin menghapus karyawan ini?</p>
              <div className="modal-buttons">
                <button onClick={() => setShowDeleteConfirm(null)}>Batal</button>
                <button onClick={() => deleteEmployee(showDeleteConfirm)} className="delete-button">Ya, Hapus</button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'normalized' && (
          <div className="tab-content">
            <h3 className="section-title">Hasil Normalisasi Matriks</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="table-header" rowSpan="2">Nama</th>
                    <th className="table-header text-center" colSpan="3">Kriteria Benefit</th>
                    <th className="table-header text-center" colSpan="3">Kriteria Cost</th>
                  </tr>
                  <tr>
                    {benefitCriteria.map(key => (<th key={key} className="table-header text-center">{criteria[key].label}<br />({criteria[key].weight})</th>))}
                    {costCriteria.map(key => (<th key={key} className="table-header text-center">{criteria[key].label}<br />({criteria[key].weight})</th>))}
                  </tr>
                </thead>
                <tbody>
                  {normalizedMatrix.map((norm) => (
                    <tr key={norm.id} className="table-row">
                      <td className="table-cell font-medium">{norm.nama}</td>
                      {benefitCriteria.map(key => (<td key={key} className="table-cell text-center">{formatNumber(norm[key])}</td>))}
                      {costCriteria.map(key => (<td key={key} className="table-cell text-center">{formatNumber(norm[key])}</td>))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'final' && (
          <div className="tab-content">
            <h3 className="section-title">Nilai Akhir dan Peringkat Karyawan</h3>
            {/* 3. Tombol ini sekarang memanggil handleExportClick */}
            <button onClick={handleExportClick} className="export-button">Cetak Hasil PDF</button>
            <div className="employee-grid">
              {finalScores.map((score) => (
                <div key={score.id} className={`employee-card ${score.rank === 1 ? 'employee-card-top' : ''}`}>
                  <div className="employee-card-header">
                    <span className={`employee-rank ${score.rank === 1 ? 'top-rank' : ''}`}>{score.rank}</span>
                    <img src={score.photo || 'https://via.placeholder.com/80'} alt={score.nama} className="employee-avatar" />
                    <h4 className="employee-name">{score.nama}</h4>
                    <p className="employee-score">{formatNumber(score.score)}</p>
                    {score.rank === 1 && (<div className="employee-award"><Award className="award-icon" /><span className="award-text">Karyawan Terbaik</span></div>)}
                  </div>
                  <div className="employee-card-footer">
                    <h5 className="criteria-title">Nilai Per Kriteria:</h5>
                    <div className="criteria-list">
                      {Object.keys(criteria).map(key => (<div key={key} className="criteria-item"><span className="criteria-label">{criteria[key].label}:</span><div className="criteria-value"><div className={`criteria-bar ${criteria[key].type === 'benefit' ? 'benefit-bar' : 'cost-bar'}`} style={{width: `${(score.criteriaScores[key] / score.score) * 100}%`}}></div><span className="criteria-score">{formatNumber(score.criteriaScores[key])}</span></div></div>))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chart' && (
          <div className="tab-content">
            <h3 className="section-title">Visualisasi Nilai Karyawan</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Legend />
                  {Object.keys(criteria).map((key, index) => (<Bar key={key} dataKey={key} name={criteria[key].label} stackId="a" fill={criteria[key].type === 'benefit' ? `hsl(${120 + index * 40}, 70%, 50%)` : `hsl(${0 + index * 40}, 70%, 50%)`} />))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="tab-content">
            <h3 className="section-title">Informasi Metode SAW</h3>
            <div className="info-grid">
              <div className="info-section">
                <h4 className="info-title">Metode Simple Additive Weighting</h4>
                <p className="info-text">Simple Additive Weighting (SAW) adalah salah satu metode Multi-Criteria Decision Making (MCDM) yang populer digunakan dalam sistem pendukung keputusan karena kesederhanaan, transparansi, dan efektivitasnya.</p>
                <h5 className="subinfo-title">Langkah-langkah Metode SAW:</h5>
                <ol className="info-list">
                  <li>Menentukan kriteria yang akan dijadikan acuan pengambilan keputusan</li>
                  <li>Menentukan rating kecocokan setiap alternatif pada setiap kriteria</li>
                  <li>Membuat matriks keputusan berdasarkan kriteria</li>
                  <li>Melakukan normalisasi matriks keputusan</li>
                  <li>Menghitung nilai preferensi untuk setiap alternatif</li>
                  <li>Mengurutkan alternatif berdasarkan nilai preferensi</li>
                </ol>
              </div>
              <div className="info-column">
                <div className="info-section">
                  <h4 className="info-title">Kriteria dan Bobot</h4>
                  <div className="criteria-grid">
                    {Object.keys(criteria).map(key => (<div key={key} className="criteria-card"><div className="criteria-card-title">{criteria[key].label}</div><div className="criteria-card-weight">Bobot: {criteria[key].weight}</div><div className={`criteria-card-type ${criteria[key].type === 'benefit' ? 'type-benefit' : 'type-cost'}`}>Tipe: {criteria[key].type === 'benefit' ? 'Benefit' : 'Cost'}</div></div>))}
                  </div>
                </div>
                <div className="info-section">
                  <h4 className="info-title">Rumus</h4>
                  <div className="formula-list">
                    <div className="formula-item"><h5 className="formula-title">Kriteria Benefit:</h5><div className="formula-box">r<sub>ij</sub> = x<sub>ij</sub> / max(x<sub>j</sub>)</div></div>
                    <div className="formula-item"><h5 className="formula-title">Kriteria Cost:</h5><div className="formula-box">r<sub>ij</sub> = min(x<sub>j</sub>) / x<sub>ij</sub></div></div>
                    <div className="formula-item"><h5 className="formula-title">Nilai Preferensi:</h5><div className="formula-box">V<sub>i</sub> = Σ(w<sub>j</sub> × r<sub>ij</sub>)</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
