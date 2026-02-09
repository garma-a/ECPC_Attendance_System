import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import api from "../services/api";
import Layout from "../components/Layout";

export default function ScanQR() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setError("");
      setResult(null);

      html5QrCodeRef.current = new Html5Qrcode("qr-reader");

      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanError
      );

      setScanning(true);
    } catch (err) {
      setError("Failed to start camera: " + err.message);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  };

  const onScanSuccess = async (decodedText, decodedResult) => {
    console.log("QR Code scanned:", decodedText);

    // Stop scanning immediately
    await stopScanning();

    try {
      // Extract token from URL or use as-is
      let token = decodedText;
      if (decodedText.includes("token=")) {
        const url = new URL(decodedText);
        token = url.searchParams.get("token");
      }

      // Get geolocation if available
      let latitude = null;
      let longitude = null;

      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (geoErr) {
          console.log("Geolocation not available");
        }
      }

      // Record attendance
      const response = await api.recordAttendance(token, latitude, longitude);

      setResult({
        success: true,
        message: language === "ar" ? response.messageAr : response.message,
        attendance: response.attendance,
      });
    } catch (err) {
      setResult({
        success: false,
        message: err.message,
      });
    }
  };

  const onScanError = (errorMessage) => {
    // Ignore common scanning errors
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            {t("scanQRCode")}
          </h1>
          <p className="text-slate-300 mb-6">{t("scanInstructions")}</p>
          {error && (
            <div className="mb-4 p-4 bg-red-900 border border-red-700 text-red-200 rounded-lg">
              {error}
            </div>
          )}
          {result && (
            <div
              className={`mb-4 p-4 rounded-lg ${result.success
                ? "bg-green-900 border border-green-700 text-green-200"
                : "bg-red-900 border border-red-700 text-red-200"
                }`}
            >
              <p className="font-bold text-lg">
                {result.success
                  ? "✓ " + t("scanSuccess")
                  : "✗ " + t("scanError")}
              </p>
              <p className="mt-2">{result.message}</p>
              {result.success && result.attendance && (
                <div className="mt-3 text-sm">
                  <p>
                    <strong>{t("sessionName")}:</strong>{" "}
                    {result.attendance.sessionName}
                  </p>
                  <p>
                    <strong>{t("courseName")}:</strong>{" "}
                    {result.attendance.courseName}
                  </p>
                  <p>
                    <strong>Time:</strong>{" "}
                    {new Date(result.attendance.scannedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="mb-6">
            <div
              id="qr-reader"
              className="border-4 border-cyan-500 rounded-lg overflow-hidden shadow-lg shadow-cyan-500/30"
              style={{ minHeight: scanning ? "300px" : "0px" }}
            ></div>
          </div>
          <div className="flex justify-center space-x-4 rtl:space-x-reverse">
            {!scanning ? (
              <button
                onClick={startScanning}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-cyan-500/50"
              >
                {t("startScanning")}
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-rose-700 transition-all shadow-lg hover:shadow-red-500/50"
              >
                {t("stopScanning")}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
