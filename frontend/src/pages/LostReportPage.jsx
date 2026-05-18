import React, { Component } from "react";
import Sidebar from "../components/Sidebar";
import AuthService from "../services/AuthService";
import PageHeader from "../components/PageHeader";
import PageFooter from "../components/PageFooter";
import {
  getStoredSidebarExpanded,
  setStoredSidebarExpanded,
} from "../utils/sidebarState";
import { API_BASE_URL } from "../config/api";

import ReportHeader from "../components/report/ReportHeader";
import ReportFormSection from "../components/report/ReportFormSection";
import ReportModals from "../components/report/ReportModals";

class LostReportPage extends Component {
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
    this.setState((prev) => ({
      selectedImage: e.target.files[0],

      errors: {
        ...prev.errors,
        bukti_visual: "",
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

  handleSubmit = async () => {
    try {
      const token = AuthService.getToken();

      if (!token) {
        alert("Session login habis");
        return;
      }

      const payload = {
        nama_barang: this.state.formData.nama_barang,
        kategori: this.state.formData.kategori,
        deskripsi: this.state.formData.deskripsi,
        lokasi: this.state.formData.lokasi,
        tanggal_kejadian: this.state.formData.tanggal_kejadian,
        dokumentasi: "",
      };

      const response = await fetch(
        `${API_BASE_URL}/laporan/kehilangan`,
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

      alert("Laporan berhasil dikirim!");

      this.props.navigate("/dashboard");
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

  render() {
    return (
      <div className="flex min-h-screen bg-[#F5F7FB] font-['Plus_Jakarta_Sans']">

        <Sidebar
          expanded={this.state.isSidebarExpanded}
          currentPath="/lapor-kehilangan"
          handleLogout={this.handleLogout}
          navigate={this.props.navigate}
        />

        <main
          className={`
            flex-1 px-4 py-4 overflow-y-auto max-w-7xl mx-auto
            transition-[margin] duration-300
            ${this.state.isSidebarExpanded ? "ml-64" : "ml-0"}
          `}
        >

          <PageHeader
            onToggleSidebar={this.toggleSidebar}
          />

          <ReportHeader
            formData={this.state.formData}
            selectedImage={this.state.selectedImage}
            sectionRefs={this.sectionRefs}
          />

          <ReportFormSection
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

          <PageFooter />

        </main>

        <ReportModals
          showCancelModal={this.state.showCancelModal}
          showSubmitModal={this.state.showSubmitModal}
          showErrorModal={this.state.showErrorModal}
          setState={(data) => this.setState(data)}
          navigate={this.props.navigate}
          handleSubmit={this.handleSubmit}
        />

      </div>
    );
  }
}

export default LostReportPage;
