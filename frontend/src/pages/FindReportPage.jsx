import React, { Component } from "react";
import AuthService from "../services/AuthService";
import UserPageLayout from "../components/UserPageLayout";
import { API_BASE_URL } from "../config/api";

import {
  getStoredSidebarExpanded,
  setStoredSidebarExpanded,
} from "../utils/sidebarState";

import ReportHeader from "../components/report/ReportHeader";
import ReportFormSection from "../components/report/ReportFormSection";
import ReportModals from "../components/report/ReportModals";

class FindReportPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      error: null,
      isSidebarExpanded: getStoredSidebarExpanded(),

      formData: {
        nama_barang: "",
        kategori: "",
        deskripsi: "",
        lokasi: "",
        tanggal_kejadian: "",
        dokumentasi: "",
      },

      selectedImage: null,
      selectedLocation: null,

      showCancelModal: false,
      showSubmitModal: false,
      showErrorModal: false,
      errorMessage: "",
      reportSubmitted: false,

      errors: {},
    };

    this.inputRefs = {
      nama_barang: React.createRef(),
      kategori: React.createRef(),
      deskripsi: React.createRef(),
      lokasi: React.createRef(),
      tanggal_kejadian: React.createRef(),
      bukti_visual: React.createRef(),
    };

    this.sectionRefs = {
      detail: React.createRef(),
      lokasi: React.createRef(),
      bukti: React.createRef(),
    };

    this.fileInputRef = React.createRef();
  }

  handleChange = (e) => {
    const { name, value } = e.target;

    this.setState((prevState) => ({
      formData: {
        ...prevState.formData,
        [name]: value,
      },

      errors: {
        ...prevState.errors,
        [name]: value.trim() ? "" : "Wajib diisi",
      },
    }));
  };

  handleImageUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      this.setState((prev) => ({
        selectedImage: null,
        errors: {
          ...prev.errors,
          selectedImage: "File harus berupa gambar",
        },
      }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.setState((prev) => ({
        selectedImage: null,
        errors: {
          ...prev.errors,
          selectedImage: "Ukuran gambar maksimal 10MB",
        },
      }));
      return;
    }

    this.setState((prev) => ({
      selectedImage: file,

      errors: {
        ...prev.errors,
        selectedImage: "",
      },
    }));
  };

  validateForm = () => {

    const errors = {};

    const requiredFields = [
      "nama_barang",
      "kategori",
      "deskripsi",
      "lokasi",
      "tanggal_kejadian",
    ];

    let firstErrorField = null;

    requiredFields.forEach((field) => {

      const value = this.state.formData[field];

      if (!value || !value.toString().trim()) {

        errors[field] = "Wajib diisi";

        if (!firstErrorField) {
          firstErrorField = field;
        }
      }
    });

    // VALIDASI FOTO
    if (!this.state.selectedImage) {

      errors.selectedImage = "Bukti visual wajib diisi";

      if (!firstErrorField) {
        firstErrorField = "selectedImage";
      }
    }

    this.setState({ errors });

    // SCROLL KE ERROR
    if (firstErrorField) {

      // KHUSUS FOTO
      if (firstErrorField === "selectedImage") {

        this.sectionRefs.bukti.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        return false;
      }

      const target =
        this.inputRefs[firstErrorField]?.current;

      if (target) {

        setTimeout(() => {

          target.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          target.focus();

        }, 200);
      }

      return false;
    }

    return true;
  };

  readImageAsDataUrl = (file) => {
    if (!file) return Promise.resolve("");

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }

        reject(new Error("Gagal membaca file gambar"));
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

handleSubmit = async () => {
  try {

    const token = AuthService.getToken();

    if (!token) {
      alert("Session login habis");
      return;
    }

    const currentUser = AuthService.getCurrentUser();
    const dokumentasi = await this.readImageAsDataUrl(
      this.state.selectedImage
    );

    if (!dokumentasi.startsWith("data:image/")) {
      alert("Gagal membaca gambar. Silakan pilih ulang file gambar.");
      return;
    }

    const payload = {
      user_id: currentUser.user_id,

      nama_barang: this.state.formData.nama_barang,
      kategori: this.state.formData.kategori,
      deskripsi: this.state.formData.deskripsi,
      lokasi: this.state.formData.lokasi,
      tanggal_kejadian: this.state.formData.tanggal_kejadian,

      dokumentasi,
    };

    const response = await fetch(
      `${API_BASE_URL}/laporan/penemuan`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert("ERROR: " + JSON.stringify(data));
      return;
    }

    this.setState({
      reportSubmitted: true,
      showSubmitModal: false,
    });

  } catch (error) {
    console.error(error);
    alert(JSON.stringify(error));
  }
};

  handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  toggleSidebar = () => {
    this.setState((prevState) => {
      const isSidebarExpanded = !prevState.isSidebarExpanded;
      setStoredSidebarExpanded(isSidebarExpanded);

      return { isSidebarExpanded };
    });
  };

  renderSuccessState() {
    return (
      <section className="min-h-[60vh] flex items-center justify-center">
        <div className="w-full max-w-xl bg-white border border-gray-100 rounded-[28px] p-8 md:p-10 text-center shadow-sm">
          <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-[#0F2747] text-white flex items-center justify-center">
            <i className="fas fa-check text-2xl"></i>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-[#0F2747] mb-3">
            Laporan berhasil dibuat
          </h2>

          <p className="text-sm text-gray-500 leading-relaxed mb-8">
            Laporan penemuan kamu sudah masuk dan akan diproses oleh admin.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => this.props.navigate("/dashboard")}
              className="h-12 rounded-xl bg-[#0F2747] text-white text-sm font-extrabold hover:bg-[#173A63] transition-colors"
            >
              <i className="fas fa-home mr-2"></i>
              Kembali ke Beranda
            </button>

            <button
              type="button"
              onClick={() => this.props.navigate("/verifikasi")}
              className="h-12 rounded-xl bg-gray-100 text-[#0F2747] text-sm font-extrabold hover:bg-gray-200 transition-colors"
            >
              <i className="fas fa-list-check mr-2"></i>
              Lihat Daftar Laporan
            </button>
          </div>
        </div>
      </section>
    );
  }

  render() {
    const user = AuthService.getCurrentUser();

    return (
      <>
        <UserPageLayout
          currentPath="/lapor-penemuan"
          isSidebarExpanded={this.state.isSidebarExpanded}
          onToggleSidebar={this.toggleSidebar}
          onLogout={this.handleLogout}
          navigate={this.props.navigate}
          userRole={user.role}
          userName={user.username}
        >

          {this.state.reportSubmitted ? (
            this.renderSuccessState()
          ) : (
            <>
              <ReportHeader
                formData={this.state.formData}
                selectedImage={this.state.selectedImage}
                sectionRefs={this.sectionRefs}
                reportType="penemuan"
              />

              <ReportFormSection
                reportType="penemuan"
                formData={this.state.formData}
                errors={this.state.errors}
                selectedImage={this.state.selectedImage}
                inputRefs={this.inputRefs}
                sectionRefs={this.sectionRefs}
                fileInputRef={this.fileInputRef}
                handleChange={this.handleChange}
                handleImageUpload={this.handleImageUpload}
                setState={(data) => this.setState(data)}
                navigate={this.props.navigate}
                validateForm={this.validateForm}
                handleSubmit={this.handleSubmit}
              />
            </>
          )}

        </UserPageLayout>

        <ReportModals
          showCancelModal={this.state.showCancelModal}
          showSubmitModal={this.state.showSubmitModal}
          showErrorModal={this.state.showErrorModal}
          errorMessage={this.state.errorMessage}
          setState={(data) => this.setState(data)}
          navigate={this.props.navigate}
          handleSubmit={this.handleSubmit}
        />
      </>
    );
  }
}

export default FindReportPage;
