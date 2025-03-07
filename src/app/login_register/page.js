"use client";
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import AdminRegisterForm from '@/components/AdminRegisterForm';

const AdminRegisterPage = () => {
  return (
    <Layout>
      <AdminRegisterForm />
    </Layout>
  );
};

export default AdminRegisterPage;