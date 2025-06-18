import React from "react";

export default function Page() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Baseball IX</h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>November 1st</p>
      <p style={{ fontSize: '1.25rem', color: '#666' }}>Austin, TX</p>
    </main>
  );
} 