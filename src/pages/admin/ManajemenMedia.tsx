import React from 'react';
import { MediaFinanceSection } from '../../components/media/MediaFinanceSection';
import { MediaInventorySection } from '../../components/media/MediaInventorySection';
import { MediaAccountsSection } from '../../components/media/MediaAccountsSection';

export const ManajemenMedia: React.FC = () => {
  return (
    <div className="space-y-4 pb-10 max-w-7xl mx-auto">
      {/* Header Halaman */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 rounded-xl shadow-sm">
        <h2 className="text-base md:text-lg font-semibold text-gray-800 leading-tight">Manajemen Media</h2>
        <p className="text-[11px] md:text-xs text-gray-500 mt-0.5">Pusat kendali operasional divisi media MB Chondro.</p>
      </div>

      <section>
        <MediaFinanceSection />
      </section>

      <section>
        <MediaInventorySection />
      </section>

      <section>
        <MediaAccountsSection />
      </section>
    </div>
  );
};
