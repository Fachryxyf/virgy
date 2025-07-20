import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';

/**
 * Helper function to load an image from a URL and return it as a Promise.
 * This is necessary because loading an image is an asynchronous operation.
 * @param {string} src The path to the image (e.g., '/mandom_logo.png').
 * @returns {Promise<HTMLImageElement>} A promise that resolves with the loaded image element.
 */
const loadImage = (src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Helps prevent CORS issues
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
    });
};

/**
 * Fungsi untuk membuat dan mengekspor laporan PDF hasil penilaian karyawan.
 * @param {Array} finalScores - Array objek berisi skor akhir dan peringkat karyawan.
 * @param {Array} normalizedMatrix - Array objek berisi matriks yang sudah dinormalisasi.
 * @param {Object} criteria - Objek berisi detail kriteria penilaian.
 * @param {Array} benefitCriteria - Array key untuk kriteria benefit.
 * @param {Array} costCriteria - Array key untuk kriteria cost.
 */
export const exportToPDF = async (finalScores, normalizedMatrix, criteria, benefitCriteria, costCriteria) => {
    // Validasi data untuk mencegah error jika data bukan array atau kosong
    if (!Array.isArray(finalScores) || finalScores.length === 0) {
        alert("Tidak ada data karyawan untuk diekspor ke PDF.");
        return;
    }
    if (!Array.isArray(normalizedMatrix) || normalizedMatrix.length === 0) {
        alert("Gagal membuat PDF: Data matriks normalisasi tidak valid atau kosong.");
        return;
    }

    try {
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        let lastY = 0;

        // PERBAIKAN: Muat logo dari file di folder public secara asynchronous
        const logo = await loadImage('/mandom_logo.png');

        const drawHeader = (docInstance) => {
            // Gunakan gambar yang sudah dimuat
            docInstance.addImage(logo, "PNG", 15, 12, 40, 20);
            docInstance.setFont('helvetica', 'bold');
            docInstance.setFontSize(14);
            docInstance.text("PT MANDOM INDONESIA Tbk", 65, 18);
            docInstance.setFont('helvetica', 'normal');
            docInstance.setFontSize(10);
            docInstance.text("Jl. Industri No. 123, Kawasan Industri Bekasi", 65, 25);
            docInstance.text("Telp: (021) 1234-5678 | Email: info@mandom.co.id", 65, 31);
            docInstance.setDrawColor(0, 0, 0);
            docInstance.setLineWidth(0.5);
            docInstance.line(15, 40, pageWidth - 15, 40);
        };

        const drawSignature = (docInstance, startY) => {
            if (startY > pageHeight - 60) {
                docInstance.addPage();
                drawHeader(docInstance);
                startY = 50;
            }
            const today = new Date();
            const formattedDate = today.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
            });
            const signatureX = pageWidth - 70;
            const signatureY = startY + 20;
            docInstance.setFontSize(12);
            docInstance.setFont('helvetica', 'normal');
            docInstance.text(`Bekasi, ${formattedDate}`, signatureX, signatureY, { align: 'center' });
            docInstance.text("Manager HRD", signatureX, signatureY + 8, { align: 'center' });
            docInstance.text("(____________________)", signatureX, signatureY + 35, { align: 'center' });
        };

        // --- HALAMAN 1 ---
        drawHeader(doc);

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text("SISTEM PENDUKUNG KEPUTUSAN KARYAWAN TERBAIK", pageWidth / 2, 60, { align: "center" });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'italic');
        doc.text("Menggunakan Metode Simple Additive Weighting (SAW)", pageWidth / 2, 70, { align: "center" });

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Hasil Perhitungan Akhir", 15, 90);

        const finalTableColumns = ["No", "Nama", "Nilai Preferensi", "Peringkat"];
        const finalTableRows = finalScores.map((emp, index) => [
            index + 1,
            emp.nama,
            emp.score.toFixed(4),
            emp.rank,
        ]);

        autoTable(doc, {
            startY: 95,
            head: [finalTableColumns],
            body: finalTableRows,
            theme: 'grid',
            headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
            styles: { halign: "center", lineWidth: 0.1, lineColor: [0, 0, 0] },
            columnStyles: { 1: { halign: 'left' } }
        });

        lastY = doc.lastAutoTable.finalY;

        if (pageHeight - lastY < 80) {
            doc.addPage();
            drawHeader(doc);
            lastY = 50;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Matriks Normalisasi", 15, lastY + 20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text("Hasil normalisasi matriks berdasarkan kriteria benefit dan cost.", 15, lastY + 27);

        const normColumns = [
            "No", "Nama",
            ...benefitCriteria.map(key => `${criteria[key].label} (Benefit)`),
            ...costCriteria.map(key => `${criteria[key].label} (Cost)`)
        ];
        const normRows = normalizedMatrix.map((row, idx) => [
            idx + 1, row.nama,
            ...benefitCriteria.map(key => row[key].toFixed(3)),
            ...costCriteria.map(key => row[key].toFixed(3)),
        ]);

        autoTable(doc, {
            startY: lastY + 32,
            head: [normColumns],
            body: normRows,
            theme: 'grid',
            headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', fontSize: 9 },
            styles: { halign: 'center', lineWidth: 0.1, lineColor: [0, 0, 0], fontSize: 9 },
            columnStyles: { 1: { halign: 'left' } },
            didDrawPage: (data) => {
                if (data.pageNumber > 1 && data.pageNumber !== doc.internal.getNumberOfPages()) {
                    drawHeader(doc);
                }
            }
        });

        lastY = doc.lastAutoTable.finalY;
        drawSignature(doc, lastY);
        doc.save("Laporan_Hasil_Karyawan_Terbaik.pdf");

    } catch (error) {
        console.error("Gagal membuat PDF:", error);
        alert("Gagal membuat PDF. Pastikan file logo 'mandom_logo.png' ada di dalam folder 'public' dan dapat diakses.");
    }
};
