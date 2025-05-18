import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Award } from 'lucide-react';
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import '../styles/Home.css';

const Home = () => {
  // State untuk menyimpan data
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [dataSource, setDataSource] = useState('loading');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    if (loggedIn !== "true") {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/");
  };
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

  // Fungsi untuk menambah karyawan
  const addEmployee = () => {
    const id = Math.max(...employees.map(e => e.id), 0) + 1;
    const updatedEmployees = [...employees, { id, ...newEmployee }];
    saveManualData(updatedEmployees);
    setIsAddingEmployee(false);
    setNewEmployee({
      nama: '',
      kinerja: 0,
      kreativitas: 0,
      inovasi: 0,
      absensi: 0,
      kedisiplinan: 0,
      perilaku: 0,
      photo: ''
    });
  };

  // Fungsi untuk mengedit karyawan
  const updateEmployee = () => {
    const updatedEmployees = employees.map(emp => 
      emp.id === editingEmployee.id ? editingEmployee : emp
    );
    saveManualData(updatedEmployees);
    setEditingEmployee(null);
  };

  // Fungsi untuk menghapus karyawan
  const deleteEmployee = (id) => {
    const updatedEmployees = employees.filter(emp => emp.id !== id);
    saveManualData(updatedEmployees);
    setShowDeleteConfirm(null);
  };

  // Print
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Warna header
    const headerColor = [41, 128, 185];
    
    // Gambar background header
    doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Garis pemisah header
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(10, 40, 200, 40);
    
    // Logo
    const logoBase64 = "data:image/png;base64,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";
    doc.addImage(logoBase64, "PNG", 15, 8, 35, 25);
    
    // Judul di header dengan warna putih
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("PT MANDOM INDONESIA Tbk", 60, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text("Jl. Industri No. 123, Kawasan Industri Bekasi", 60, 28);
    doc.text("Telp: (021) 1234-5678 | Email: info@mandom.co.id", 60, 36);
    
    // Reset warna teks
    doc.setTextColor(0, 0, 0);
    
    // Judul dokumen
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("SISTEM PENDUKUNG KEPUTUSAN", 105, 55, { align: "center" });
    doc.text("KARYAWAN TERBAIK", 105, 65, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.text("Menggunakan Metode Simple Additive Weighting (SAW)", 105, 75, { align: "center" });

    
    // Tambahkan border halaman
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(1);
    doc.rect(5, 5, 200, 287);
    
    // Tambahkan footer
    doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
    doc.rect(0, 277, 210, 20, 'F');
    
    // Tanggal cetak
    const today = new Date();
    const formattedDate = today.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`Tanggal Cetak: ${formattedDate}`, 15, 287);
    doc.text("PT Mandom Indonesia Tbk — Bekasi", 105, 287, { align: "center" });
    doc.text("Halaman 1", 195, 287, { align: "right" });
    
    // Reset warna teks
    doc.setTextColor(0, 0, 0);

    // Judul tabel 1
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Hasil Perhitungan Akhir", 15, 95);
    
    // Tambahkan deskripsi
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text("Berikut adalah hasil perhitungan nilai preferensi dan peringkat karyawan:", 15, 105);

    // Tabel hasil akhir
    const tableColumn = ["No", "Nama", "Nilai Preferensi", "Peringkat"];
    const tableRows = finalScores.map((emp, index) => [
      index + 1,
      emp.nama,
      emp.score.toFixed(4),
      emp.rank,
    ]);

    autoTable(doc, {
      startY: 110,
      head: [tableColumn],
      body: tableRows,
      styles: { 
        halign: "center",
        lineWidth: 0.1,
        lineColor: [0, 0, 0]
      },
      headStyles: { 
        fillColor: headerColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 40 },
        3: { cellWidth: 30 }
      },
      alternateRowStyles: {
        fillColor: [240, 248, 255]
      },
      theme: "grid"
    });

    // Tambahkan halaman baru
    doc.addPage();
    
    // Header di halaman 2 (mirip ama halaman 1)
    doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Garis pemisah header
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(10, 40, 200, 40);
    
    // Logo di halaman 2
    doc.addImage(logoBase64, "PNG", 15, 8, 35, 25);
    
    // Judul di header pake warna putih
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("PT MANDOM INDONESIA Tbk", 60, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text("Jl. Industri No. 123, Kawasan Industri Bekasi", 60, 28);
    doc.text("Telp: (021) 1234-5678 | Email: info@mandom.co.id", 60, 36);
    
    // Tambahkan border halaman
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(1);
    doc.rect(5, 5, 200, 287);
    
    // Tambahkan footer di halaman 2
    doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
    doc.rect(0, 277, 210, 20, 'F');
    
    // Informasi footer halaman 2
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`Tanggal Cetak: ${formattedDate}`, 15, 287);
    doc.text("PT Mandom Indonesia Tbk — Bekasi", 105, 287, { align: "center" });
    doc.text("Halaman 2", 195, 287, { align: "right" });
    
    // Reset warna teks
    doc.setTextColor(0, 0, 0);

    // Judul tabel 2 (di halaman baru)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Matriks Normalisasi", 15, 55);
    
    // Tambahkan deskripsi
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text("Berikut adalah hasil normalisasi matriks berdasarkan kriteria benefit dan cost:", 15, 65);

    // Tabel normalisasi
    const normColumns = [
      "No", 
      "Nama", 
      ...benefitCriteria.map(key => criteria[key].label + `\n(${criteria[key].weight})`),
      ...costCriteria.map(key => criteria[key].label + `\n(${criteria[key].weight})`)
    ];
    
    const normRows = normalizedMatrix.map((row, idx) => [
      idx + 1,
      row.nama,
      ...benefitCriteria.map(key => row[key].toFixed(4)),
      ...costCriteria.map(key => row[key].toFixed(4)),
    ]);

    autoTable(doc, {
      startY: 70,
      head: [normColumns],
      body: normRows,
      styles: { 
        halign: 'center',
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
        overflow: 'linebreak',
        fontSize: 9
      },
      headStyles: { 
        fillColor: headerColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 40 }
      },
      alternateRowStyles: {
        fillColor: [240, 248, 255]
      },
      theme: "grid",
      didDrawPage: function(data) {
        // Callback yang dipanggil setiap halaman baru dibuat
        if (data.pageNumber > 1) {
          // Tambahkan header dan footer ke halaman tambahan jika tabel terlalu panjang
          // Header
          doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
          doc.rect(0, 0, 210, 40, 'F');
          
          // Logo
          doc.addImage(logoBase64, "PNG", 15, 8, 35, 25);
          
          // Judul di header
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text("PT MANDOM INDONESIA Tbk", 60, 20);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          doc.text("Jl. Industri No. 123, Kawasan Industri Bekasi", 60, 28);
          doc.text("Telp: (021) 1234-5678 | Email: info@mandom.co.id", 60, 36);
          
          // Border
          doc.setDrawColor(41, 128, 185);
          doc.setLineWidth(1);
          doc.rect(5, 5, 200, 287);
          
          // Footer
          doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
          doc.rect(0, 277, 210, 20, 'F');
          
          // Info footer
          doc.setFontSize(10);
          doc.setTextColor(255, 255, 255);
          doc.text(`Tanggal Cetak: ${formattedDate}`, 15, 287);
          doc.text("PT Mandom Indonesia Tbk — Bekasi", 105, 287, { align: "center" });
          doc.text(`Halaman ${data.pageNumber}`, 195, 287, { align: "right" });
          
          // Reset teks
          doc.setTextColor(0, 0, 0);
        }
      }
    });

    // Tambahkan preview sebelum menyimpan
    const pdfData = doc.output('datauristring');
    
    // Buat modal preview dengan style yang lebih menarik
    const previewModal = document.createElement('div');
    previewModal.style.position = 'fixed';
    previewModal.style.top = '0';
    previewModal.style.left = '0';
    previewModal.style.width = '100%';
    previewModal.style.height = '100%';
    previewModal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    previewModal.style.zIndex = '9999';
    previewModal.style.display = 'flex';
    previewModal.style.flexDirection = 'column';
    previewModal.style.alignItems = 'center';
    previewModal.style.justifyContent = 'center';

    // Buat container untuk preview dan tombol
    const previewContainer = document.createElement('div');
    previewContainer.style.backgroundColor = 'white';
    previewContainer.style.padding = '20px';
    previewContainer.style.borderRadius = '10px';
    previewContainer.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
    previewContainer.style.width = '80%';
    previewContainer.style.maxWidth = '900px';
    previewContainer.style.maxHeight = '90%';
    previewContainer.style.display = 'flex';
    previewContainer.style.flexDirection = 'column';
    previewContainer.style.alignItems = 'center';
    previewContainer.style.overflow = 'hidden';

    // Tambahkan judul preview
    const previewTitle = document.createElement('h2');
    previewTitle.textContent = 'Preview Dokumen';
    previewTitle.style.margin = '0 0 20px 0';
    previewTitle.style.color = '#2980b9';
    previewTitle.style.fontFamily = 'Arial, sans-serif';
    previewContainer.appendChild(previewTitle);

    // Tambahkan iframe untuk preview PDF
    const previewFrame = document.createElement('iframe');
    previewFrame.src = pdfData;
    previewFrame.style.width = '100%';
    previewFrame.style.height = '70vh';
    previewFrame.style.border = '1px solid #ddd';
    previewFrame.style.borderRadius = '5px';
    previewContainer.appendChild(previewFrame);

    // Tambahkan tombol untuk menyimpan atau membatalkan
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.gap = '20px';
    buttonContainer.style.width = '100%';
    buttonContainer.style.marginTop = '20px';

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Simpan PDF';
    saveButton.style.padding = '12px 30px';
    saveButton.style.backgroundColor = '#2980b9';
    saveButton.style.color = 'white';
    saveButton.style.border = 'none';
    saveButton.style.borderRadius = '5px';
    saveButton.style.cursor = 'pointer';
    saveButton.style.fontWeight = 'bold';
    saveButton.style.fontSize = '14px';
    saveButton.style.transition = 'background-color 0.3s';
    saveButton.onmouseover = () => {
      saveButton.style.backgroundColor = '#3498db';
    };
    saveButton.onmouseout = () => {
      saveButton.style.backgroundColor = '#2980b9';
    };
    saveButton.onclick = () => {
      doc.save("hasil_karyawan_terbaik.pdf");
      document.body.removeChild(previewModal);
    };

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Batal';
    cancelButton.style.padding = '12px 30px';
    cancelButton.style.backgroundColor = '#e74c3c';
    cancelButton.style.color = 'white';
    cancelButton.style.border = 'none';
    cancelButton.style.borderRadius = '5px';
    cancelButton.style.cursor = 'pointer';
    cancelButton.style.fontWeight = 'bold';
    cancelButton.style.fontSize = '14px';
    cancelButton.style.transition = 'background-color 0.3s';
    cancelButton.onmouseover = () => {
      cancelButton.style.backgroundColor = '#c0392b';
    };
    cancelButton.onmouseout = () => {
      cancelButton.style.backgroundColor = '#e74c3c';
    };
    cancelButton.onclick = () => {
      document.body.removeChild(previewModal);
    };

    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(saveButton);
    previewContainer.appendChild(buttonContainer);
    previewModal.appendChild(previewContainer);
    document.body.appendChild(previewModal);
  };

  // Data karyawan (fallback jika API gagal)
  const fallbackData = [
    { 
      id: 1, 
      nama: "Ari", 
      kinerja: 85, 
      kreativitas: 70, 
      inovasi: 75, 
      absensi: 2, 
      kedisiplinan: 3, 
      perilaku: 1,
      photo: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    { 
      id: 2, 
      nama: "Budi", 
      kinerja: 90, 
      kreativitas: 80, 
      inovasi: 85, 
      absensi: 1, 
      kedisiplinan: 2, 
      perilaku: 2,
      photo: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    { 
      id: 3, 
      nama: "Citra", 
      kinerja: 75, 
      kreativitas: 65, 
      inovasi: 70, 
      absensi: 3, 
      kedisiplinan: 4, 
      perilaku: 3,
      photo: "https://randomuser.me/api/portraits/women/44.jpg"
    },
    { 
      id: 4, 
      nama: "Dina", 
      kinerja: 88, 
      kreativitas: 75, 
      inovasi: 78, 
      absensi: 2, 
      kedisiplinan: 2, 
      perilaku: 1,
      photo: "https://randomuser.me/api/portraits/women/44.jpg"
    },
    { 
      id: 5, 
      nama: "Eko", 
      kinerja: 70, 
      kreativitas: 60, 
      inovasi: 65, 
      absensi: 1, 
      kedisiplinan: 3, 
      perilaku: 2,
      photo: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    { 
      id: 6, 
      nama: "Sahar", 
      kinerja: 69, 
      kreativitas: 60, 
      inovasi: 63, 
      absensi: 5, 
      kedisiplinan: 3, 
      perilaku: 1,
      photo: "https://randomuser.me/api/portraits/men/32.jpg"
    },
        { 
      id: 7, 
      nama: "Juliana", 
      kinerja: 63, 
      kreativitas: 80, 
      inovasi: 90, 
      absensi: 3, 
      kedisiplinan: 1, 
      perilaku: 4,
      photo: "https://randomuser.me/api/portraits/women/32.jpg"
    },
    { 
      id: 8, 
      nama: "Adam", 
      kinerja: 72, 
      kreativitas: 50, 
      inovasi: 45, 
      absensi: 1, 
      kedisiplinan: 1, 
      perilaku: 1,
      photo: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    { 
      id: 9, 
      nama: "Christine", 
      kinerja: 90, 
      kreativitas: 50, 
      inovasi: 45, 
      absensi: 1, 
      kedisiplinan: 1, 
      perilaku: 0.5,
      photo: "https://randomuser.me/api/portraits/women/15.jpg"
    },
    { 
      id: 10, 
      nama: "Vania", 
      kinerja: 90, 
      kreativitas: 70, 
      inovasi: 95, 
      absensi: 4, 
      kedisiplinan: 2, 
      perilaku: 4,
      photo: "https://randomuser.me/api/portraits/women/32.jpg"
    },
    { 
      id: 11, 
      nama: "Tirta", 
      kinerja: 72, 
      kreativitas: 90, 
      inovasi: 95, 
      absensi: 2, 
      kedisiplinan: 4, 
      perilaku: 1,
      photo: "https://randomuser.me/api/portraits/men/32.jpg"
    }
  ];

  // Konfigurasi kriteria dengan bobot dan tipe (benefit/cost)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const criteria = {
    kinerja: { weight: 0.25, type: 'benefit', label: 'Kinerja' },
    kreativitas: { weight: 0.20, type: 'benefit', label: 'Kreativitas' },
    inovasi: { weight: 0.15, type: 'benefit', label: 'Inovasi' },
    absensi: { weight: 0.15, type: 'cost', label: 'Absensi' },
    kedisiplinan: { weight: 0.15, type: 'cost', label: 'Kedisiplinan' },
    perilaku: { weight: 0.10, type: 'cost', label: 'Perilaku' }
  };

  // Mendapatkan kriteria berdasarkan tipe
  const benefitCriteria = useMemo(() => 
    Object.keys(criteria).filter(key => criteria[key].type === 'benefit'),
    [criteria]
  );
  
  const costCriteria = useMemo(() => 
    Object.keys(criteria).filter(key => criteria[key].type === 'cost'),
    [criteria]
  );

  // Fungsi untuk mengambil data
  const fetchData = async () => {
    setLoading(true);
    setDataSource('loading');
    try {
      // Simulasi API call dengan timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulasi gagal fetch API
      // const response = await fetch('api/employees');
      // const data = await response.json();
      
      throw new Error("API tidak tersedia");
      
      // setEmployees(data);
      // setDataSource('api');
    } catch (error) {
      console.log("Menggunakan data fallback:", error);
      const localData = JSON.parse(localStorage.getItem("manualEmployeeData"));
      if (localData && Array.isArray(localData)) {
        console.log("Menggunakan data manual dari localStorage.");
        setEmployees(localData);
        setDataSource('manual');
      } else {
        setEmployees(fallbackData);
        setDataSource('fallback');
      }
      setDataSource('fallback');
    } finally {
      setLoading(false);
    }
  };

  // Jalankan fetch data saat komponen dimuat
  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveManualData = (newData) => {
    localStorage.setItem("manualEmployeeData", JSON.stringify(newData));
    setEmployees(newData);
    setDataSource('manual');
  };

  // Fungsi normalisasi matriks keputusan
  const normalizedMatrix = useMemo(() => {
    if (!employees.length) return [];
    
    // Cari nilai maksimum dan minimum untuk setiap kriteria
    const maxValues = {};
    const minValues = {};
    
    // Inisialisasi nilai max dan min
    [...benefitCriteria, ...costCriteria].forEach(criteria => {
      maxValues[criteria] = Math.max(...employees.map(emp => emp[criteria] || 0));
      minValues[criteria] = Math.min(...employees.map(emp => emp[criteria] || 0));
    });
    
    // Normalisasi matriks keputusan
    return employees.map(employee => {
      const normalizedValues = {
        id: employee.id,
        nama: employee.nama,
        photo: employee.photo
      };
      
      // Normalisasi kriteria benefit: rij = xij / max(xj)
      benefitCriteria.forEach(key => {
        normalizedValues[key] = maxValues[key] ? (employee[key] / maxValues[key]) : 0;
      });
      
      // Normalisasi kriteria cost: rij = min(xj) / xij
      costCriteria.forEach(key => {
        normalizedValues[key] = employee[key] ? (minValues[key] / employee[key]) : 0;
      });
      
      return normalizedValues;
    });
  }, [employees, benefitCriteria, costCriteria]);

  // Menghitung nilai preferensi dan peringkat
  const finalScores = useMemo(() => {
    if (!normalizedMatrix.length) return [];
    
    // Hitung nilai preferensi (Vi)
    const scores = normalizedMatrix.map(normEmployee => {
      // Vi = Σ(wj × rij)
      let totalScore = 0;
      
      Object.keys(criteria).forEach(key => {
        totalScore += criteria[key].weight * (normEmployee[key] || 0);
      });
      
      return {
        id: normEmployee.id,
        nama: normEmployee.nama,
        photo: normEmployee.photo,
        score: totalScore,
        // Tambahkan nilai per kriteria untuk visualisasi
        criteriaScores: Object.keys(criteria).reduce((acc, key) => {
          acc[key] = criteria[key].weight * (normEmployee[key] || 0);
          return acc;
        }, {})
      };
    });
    
    // Urutkan nilai preferensi dari tertinggi ke terendah
    const sortedScores = [...scores].sort((a, b) => b.score - a.score);
    
    // Tambahkan informasi peringkat
    return sortedScores.map((score, index) => ({
      ...score,
      rank: index + 1
    }));
  }, [normalizedMatrix, criteria]);

  // Data untuk chart
  const chartData = useMemo(() => {
    return finalScores.map(score => ({
      name: score.nama,
      ...score.criteriaScores,
      total: score.score
    }));
  }, [finalScores]);

  // Fungsi untuk memformat angka
  const formatNumber = (num) => {
    return Number(num).toFixed(3);
  };

  // Render loading state
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

      {dataSource === 'fallback' && (
        <div className="alert alert-warning">
          <AlertTriangle className="alert-icon" />
          <div className="alert-content">
            <p className="alert-title">Menggunakan data fallback (API tidak tersedia)</p>
            <p className="alert-message">Data yang ditampilkan adalah data contoh.</p>
          </div>
          <button 
            onClick={fetchData}
            className="alert-button"
          >
            <svg className="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Coba Lagi
          </button>
        </div>
      )}

      <div className="tabs">
                <button 
          className={`tab-button ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          Home
        </button>
        <button 
          className={`tab-button ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          Data Karyawan
        </button>
        <button 
          className={`tab-button ${activeTab === 'normalized' ? 'active' : ''}`}
          onClick={() => setActiveTab('normalized')}
        >
          Matriks Normalisasi
        </button>
        <button 
          className={`tab-button ${activeTab === 'final' ? 'active' : ''}`}
          onClick={() => setActiveTab('final')}
        >
          Hasil Akhir
        </button>
        <button 
          className={`tab-button ${activeTab === 'chart' ? 'active' : ''}`}
          onClick={() => setActiveTab('chart')}
        >
          Visualisasi
        </button>
        <button 
          className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Informasi Metode
        </button>
      </div>

      <div className="content-panel">

        {/* Home */}
        {activeTab === 'home' && (
          <div className="home-tab-content">
            <h2>Selamat Datang di Sistem Pendukung Keputusan Karyawan Terbaik</h2>
            <h2>PT. Mandom Indonesia Tbk</h2>
            <p>Gunakan menu di atas untuk mengakses data dan fitur.</p>
          </div>
        )}
        
        {/* Data Karyawan */}
        {activeTab === 'employees' && (
          <div className="tab-content">
            <h3 className="section-title">Data Penilaian Karyawan</h3>
            <div className="manual-actions">
              <button 
                onClick={() => setIsAddingEmployee(true)} 
                className="manual-button add"
              >
                Tambah Karyawan
              </button>
              <button onClick={() => setIsEditing(true)} className="manual-button">Edit Manual</button>
              <button onClick={() => setShowResetConfirm(true)} className="manual-button reset">Reset Data Manual</button>
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
                    {Object.keys(criteria).map(key => (
                      criteria[key].type === 'benefit' && (
                        <th key={key} className="table-header text-center">
                          {criteria[key].label}<br />({criteria[key].weight})
                        </th>
                      )
                    ))}
                    {Object.keys(criteria).map(key => (
                      criteria[key].type === 'cost' && (
                        <th key={key} className="table-header text-center">
                          {criteria[key].label}<br />({criteria[key].weight})
                        </th>
                      )
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="table-row">
                      <td className="table-cell"><img src={employee.photo} alt={employee.nama} className="employee-photo" /></td>
                      <td className="table-cell font-medium">{employee.nama}</td>
                      {benefitCriteria.map(key => (
                        <td key={key} className="table-cell text-center">{employee[key]}</td>
                      ))}
                      {costCriteria.map(key => (
                        <td key={key} className="table-cell text-center">{employee[key]}</td>
                      ))}
                      <td className="table-cell">
                        <div className="action-buttons">
                          <button 
                            onClick={() => setEditingEmployee({...employee})} 
                            className="action-button edit"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => setShowDeleteConfirm(employee.id)} 
                            className="action-button delete"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="info-box">
              <p><strong>Kriteria Benefit:</strong> Nilai lebih tinggi lebih baik</p>
              <p><strong>Kriteria Cost:</strong> Nilai lebih rendah lebih baik</p>
            </div>
          </div>
        )}

        {/* Modal Tambah Karyawan */}
        {isAddingEmployee && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Tambah Karyawan Baru</h3>
              <div className="form-group">
                <label>Nama:</label>
                <input 
                  type="text" 
                  value={newEmployee.nama} 
                  onChange={(e) => setNewEmployee({...newEmployee, nama: e.target.value})}
                />
              </div>
              {Object.keys(criteria).map(key => (
                <div className="form-group" key={key}>
                  <label>{criteria[key].label}:</label>
                  <input 
                    type="number" 
                    value={newEmployee[key]} 
                    onChange={(e) => setNewEmployee({...newEmployee, [key]: parseFloat(e.target.value) || 0})}
                  />
                </div>
              ))}
              <div className="form-group">
                <label>Foto:</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.size > 500 * 1024) { // 500 KB = 500 * 1024 bytes
                        alert('Ukuran foto maksimal 500 KB. Silakan pilih file yang lebih kecil.');
                        e.target.value = ''; // reset input file supaya tidak ada file terpilih
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setNewEmployee({ ...newEmployee, photo: reader.result });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {newEmployee.photo && (
                  <img 
                    src={newEmployee.photo} 
                    alt="Preview" 
                    className="employee-photo-preview" 
                    style={{ marginTop: '10px', height: '80px', borderRadius: '8px' }}
                  />
                )}
              </div>
              <div className="modal-buttons">
                <button onClick={() => setIsAddingEmployee(false)}>Batal</button>
                <button onClick={addEmployee}>Simpan</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Edit Karyawan */}
        {editingEmployee && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Edit Karyawan</h3>
              <div className="form-group">
                <label>Nama:</label>
                <input 
                  type="text" 
                  value={editingEmployee.nama} 
                  onChange={(e) => setEditingEmployee({...editingEmployee, nama: e.target.value})}
                />
              </div>
              {Object.keys(criteria).map(key => (
                <div className="form-group" key={key}>
                  <label>{criteria[key].label}:</label>
                  <input 
                    type="number" 
                    value={editingEmployee[key]} 
                    onChange={(e) => setEditingEmployee({...editingEmployee, [key]: parseFloat(e.target.value) || 0})}
                  />
                </div>
              ))}
              <div className="form-group">
                <label>Foto:</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.size > 500 * 1024) { // 500 KB = 500 * 1024 bytes
                        alert('Ukuran foto maksimal 500 KB. Silakan pilih file yang lebih kecil.');
                        e.target.value = ''; // reset input file supaya tidak ada file terpilih
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setEditingEmployee({ ...editingEmployee, photo: reader.result });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {editingEmployee.photo && (
                  <img 
                    src={editingEmployee.photo} 
                    alt="Preview" 
                    className="employee-photo-preview" 
                    style={{ marginTop: '10px', height: '80px', borderRadius: '8px' }}
                  />
                )}
              </div>
              <div className="modal-buttons">
                <button onClick={() => setEditingEmployee(null)}>Batal</button>
                <button onClick={updateEmployee}>Simpan</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Hapus */}
        {showDeleteConfirm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Konfirmasi Hapus</h3>
              <p>Apakah Anda yakin ingin menghapus karyawan ini?</p>
              <div className="modal-buttons">
                <button onClick={() => setShowDeleteConfirm(null)}>Batal</button>
                <button 
                  onClick={() => deleteEmployee(showDeleteConfirm)} 
                  className="delete-button"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {isEditing && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Edit Data Karyawan</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    {Object.keys(criteria).map(key => (
                      <th key={key}>{criteria[key].label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(employees || []).map((emp, i) => (
                    <tr key={emp.id}>
                      <td>{emp.nama}</td>
                      {Object.keys(criteria).map(key => (
                        <td key={key}>
                          <input
                            type="number"
                            value={editData[i]?.[key] ?? emp[key]}
                            onChange={(e) => {
                              const newVal = parseFloat(e.target.value);
                              const updated = [...editData];
                              updated[i] = { ...emp, ...(updated[i] || {}), [key]: newVal };
                              setEditData(updated);
                            }}
                            style={{ width: '60px' }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="modal-buttons">
                <button onClick={() => setIsEditing(false)}>Batal</button>
                <button onClick={() => {
                  const finalData = employees.map((emp, i) => ({ ...emp, ...editData[i] }));
                  saveManualData(finalData);
                  setIsEditing(false);
                }}>Simpan Manual</button>
              </div>
            </div>
          </div>
        )}

        {showResetConfirm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Konfirmasi Reset</h3>
              <p>Apakah Anda yakin ingin mengosongkan semua nilai karyawan?</p>
              <div className="modal-buttons">
                <button onClick={() => setShowResetConfirm(false)}>Batal</button>
                <button
                  onClick={() => {
                    const zeroedData = employees.map(emp => ({
                      ...emp,
                      kinerja: 0,
                      kreativitas: 0,
                      inovasi: 0,
                      absensi: 0,
                      kedisiplinan: 0,
                      perilaku: 0
                    }));
                    localStorage.setItem("manualEmployeeData", JSON.stringify(zeroedData));
                    setEmployees(zeroedData);
                    setDataSource('manual');
                    setShowResetConfirm(false);
                  }}
                  className="manual-button reset"
                >
                  Ya, Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Normalisasi */}
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
                    {Object.keys(criteria).map(key => (
                      criteria[key].type === 'benefit' && (
                        <th key={key} className="table-header text-center">
                          {criteria[key].label}<br />({criteria[key].weight})
                        </th>
                      )
                    ))}
                    {Object.keys(criteria).map(key => (
                      criteria[key].type === 'cost' && (
                        <th key={key} className="table-header text-center">
                          {criteria[key].label}<br />({criteria[key].weight})
                        </th>
                      )
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {normalizedMatrix.map((norm) => (
                    <tr key={norm.id} className="table-row">
                      <td className="table-cell font-medium">{norm.nama}</td>
                      {benefitCriteria.map(key => (
                        <td key={key} className="table-cell text-center">{formatNumber(norm[key])}</td>
                      ))}
                      {costCriteria.map(key => (
                        <td key={key} className="table-cell text-center">{formatNumber(norm[key])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="info-box">
              <p><strong>Normalisasi Benefit:</strong> rij = xij / max(xj)</p>
              <p><strong>Normalisasi Cost:</strong> rij = min(xj) / xij</p>
            </div>
          </div>
        )}

        {/* Hasil Akhir */}
        {activeTab === 'final' && (
          <div className="tab-content">
            <h3 className="section-title">Nilai Akhir dan Peringkat Karyawan</h3>
            <button onClick={handleExportPDF}>Cetak Hasil PDF</button>
            <div className="employee-grid">
              {finalScores.map((score) => (
                <div 
                  key={score.id} 
                  className={`employee-card ${score.rank === 1 ? 'employee-card-top' : ''}`}
                >
                  <div className="employee-card-header">
                    <span className={`employee-rank ${score.rank === 1 ? 'top-rank' : ''}`}>
                      {score.rank}
                    </span>
                    <img src={score.photo} alt={score.nama} className="employee-avatar" />
                    <h4 className="employee-name">{score.nama}</h4>
                    <p className="employee-score">{formatNumber(score.score)}</p>
                    
                    {score.rank === 1 && (
                      <div className="employee-award">
                        <Award className="award-icon" />
                        <span className="award-text">Karyawan Terbaik</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="employee-card-footer">
                    <h5 className="criteria-title">Nilai Per Kriteria:</h5>
                    <div className="criteria-list">
                      {Object.keys(criteria).map(key => (
                        <div key={key} className="criteria-item">
                          <span className="criteria-label">{criteria[key].label}:</span>
                          <div className="criteria-value">
                            <div 
                              className={`criteria-bar ${criteria[key].type === 'benefit' ? 'benefit-bar' : 'cost-bar'}`} 
                              style={{width: `${(score.criteriaScores[key] / score.score) * 100}%`}}
                            ></div>
                            <span className="criteria-score">{formatNumber(score.criteriaScores[key])}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="info-box">
              <p><strong>Rumus Nilai Akhir:</strong> Vi = Σ(wj × rij)</p>
              <p><strong>Keterangan:</strong> Nilai tertinggi adalah karyawan terbaik</p>
            </div>
          </div>
        )}

        {/* Visualisasi */}
        {activeTab === 'chart' && (
          <div className="tab-content">
            <h3 className="section-title">Visualisasi Nilai Karyawan</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Legend />
                  {Object.keys(criteria).map((key, index) => (
                    <Bar 
                      key={key} 
                      dataKey={key} 
                      name={criteria[key].label} 
                      stackId="a" 
                      fill={criteria[key].type === 'benefit' ? 
                        `hsl(${120 + index * 40}, 70%, 50%)` : 
                        `hsl(${0 + index * 40}, 70%, 50%)`} 
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="info-box">
              <p><strong>Visualisasi:</strong> Menunjukkan kontribusi masing-masing kriteria pada nilai akhir</p>
              <p><strong>Catatan:</strong> Kriteria benefit divisualisasikan dengan warna hijau, kriteria cost dengan warna merah</p>
            </div>
          </div>
        )}

        {/* Informasi Metode */}
        {activeTab === 'info' && (
          <div className="tab-content">
            <h3 className="section-title">Informasi Metode SAW</h3>
            
            <div className="info-grid">
              <div className="info-section">
                <h4 className="info-title">
                  <svg className="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
                  </svg>
                  Metode Simple Additive Weighting
                </h4>
                <p className="info-text">
                  Simple Additive Weighting (SAW) adalah salah satu metode Multi-Criteria Decision Making (MCDM) yang populer 
                  digunakan dalam sistem pendukung keputusan karena kesederhanaan, transparansi, dan efektivitasnya.
                </p>
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
                    {Object.keys(criteria).map(key => (
                      <div key={key} className="criteria-card">
                        <div className="criteria-card-title">{criteria[key].label}</div>
                        <div className="criteria-card-weight">Bobot: {criteria[key].weight}</div>
                        <div className={`criteria-card-type ${criteria[key].type === 'benefit' ? 'type-benefit' : 'type-cost'}`}>
                          Tipe: {criteria[key].type === 'benefit' ? 'Benefit' : 'Cost'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="info-section">
                  <h4 className="info-title">Rumus Normalisasi</h4>
                  <div className="formula-list">
                    <div className="formula-item">
                      <h5 className="formula-title">Kriteria Benefit:</h5>
                      <div className="formula-box">
                        r<sub>ij</sub> = x<sub>ij</sub> / max(x<sub>j</sub>)
                      </div>
                      <p className="formula-desc">Semakin besar nilai, semakin baik</p>
                    </div>
                    <div className="formula-item">
                      <h5 className="formula-title">Kriteria Cost:</h5>
                      <div className="formula-box">
                        r<sub>ij</sub> = min(x<sub>j</sub>) / x<sub>ij</sub>
                      </div>
                      <p className="formula-desc">Semakin kecil nilai, semakin baik</p>
                    </div>
                    <div className="formula-item">
                      <h5 className="formula-title">Nilai Preferensi:</h5>
                      <div className="formula-box">
                        V<sub>i</sub> = Σ(w<sub>j</sub> × r<sub>ij</sub>)
                      </div>
                      <p className="formula-desc">Jumlah dari perkalian bobot dan nilai normalisasi</p>
                    </div>
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