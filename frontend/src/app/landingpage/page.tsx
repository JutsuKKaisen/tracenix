"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileStack,
  ShieldCheck,
  Smartphone,
  Workflow,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { TracenixGlobe } from "@/components/ui/tracenix-globe";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand/brand-logo";

const heroBullets = [
  "Lưu trữ hồ sơ tập trung",
  "Luân chuyển và phê duyệt theo workflow",
  "Kiểm soát tính đầy đủ và hợp lệ",
  "Audit trail và truy vết rõ ràng",
  "Kết nối hiện trường với văn phòng",
];

const problemBullets = [
  "Hồ sơ phân tán ở email, chat, bảng tính và thư mục cá nhân.",
  "Sai phiên bản, chậm phê duyệt, khó truy vết trách nhiệm xử lý.",
  "Thiếu hồ sơ compliance khi cần nghiệm thu, thanh tra hoặc đối chiếu.",
  "Dữ liệu hiện trường và văn phòng không đồng bộ.",
  "Đội ngũ mất thời gian kiểm soát giấy tờ thay vì tập trung vận hành.",
];

const solutionBullets = [
  "Quản lý toàn bộ vòng đời hồ sơ công trình trên một nền tảng thống nhất.",
  "Tổ chức hồ sơ theo đúng luồng vận hành thực tế của doanh nghiệp xây dựng.",
  "Theo dõi trạng thái xử lý, tính hợp lệ và mức độ sẵn sàng của hồ sơ.",
  "Giảm rủi ro pháp lý và tăng hiệu quả phối hợp liên phòng ban.",
  "Thúc đẩy chuyển đổi số từ công trường đến văn phòng.",
];

const capabilities = [
  {
    icon: FileStack,
    title: "Lưu trữ hồ sơ tập trung",
    description: "Quản lý hồ sơ theo dự án, hạng mục, giai đoạn và người phụ trách trên một cấu trúc thống nhất.",
  },
  {
    icon: Workflow,
    title: "Luân chuyển và phê duyệt hồ sơ",
    description: "Theo dõi rõ từng bước từ tạo lập, gửi duyệt, phản hồi, bổ sung đến phê duyệt hoàn tất.",
  },
  {
    icon: ClipboardCheck,
    title: "Kiểm soát tính đầy đủ và hợp lệ",
    description: "Biết chính xác hồ sơ nào còn thiếu, sắp hết hiệu lực hoặc chưa đạt điều kiện trước nghiệm thu.",
  },
  {
    icon: ShieldCheck,
    title: "Theo dõi lịch sử xử lý",
    description: "Mọi thao tác được ghi nhận để phục vụ kiểm tra, đối chiếu, audit và giải trình khi cần.",
  },
  {
    icon: Smartphone,
    title: "Kết nối hiện trường với văn phòng",
    description: "Đồng bộ nhanh hồ sơ, hình ảnh và biên bản phát sinh tại công trường để giảm độ trễ vận hành.",
  },
];

const differentiation = [
  "Nhẹ hơn ERP, chuyên sâu hơn DMS phổ thông.",
  "Thiết kế chuyên biệt cho bài toán hồ sơ xây dựng tại Việt Nam.",
  "Kết hợp tài liệu, workflow, compliance và audit trail trong một nền tảng.",
  "Mobile-first cho đội hiện trường, vẫn đảm bảo kiểm soát ở cấp quản lý.",
  "Phù hợp với nhà thầu đang tăng trưởng cần kiểm soát vận hành thực tế.",
];

const targetCustomers = [
  "Nhà thầu đang tăng trưởng và quản lý nhiều dự án cùng lúc.",
  "Startup nhà thầu nhỏ cần chuẩn hóa vận hành ngay từ đầu.",
  "Doanh nghiệp có yêu cầu compliance cao, cần truy vết rõ ràng.",
  "Vai trò trọng tâm: Project Manager, QA/QC, Document Controller, Giám sát công trình.",
];

const operationalValues = [
  "Giảm thất lạc hồ sơ",
  "Giảm sai phiên bản",
  "Rút ngắn thời gian phê duyệt",
  "Tăng khả năng theo dõi theo dự án",
  "Tăng mức độ sẵn sàng cho audit, nghiệm thu và thanh tra",
];

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="max-w-3xl space-y-3">
      <p className="text-xs uppercase tracking-[0.25em] text-blue-300/90">{eyebrow}</p>
      <h2 className="text-3xl font-heading font-semibold text-slate-50 md:text-4xl">{title}</h2>
      <p className="text-slate-300/90">{subtitle}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(120%_80%_at_80%_0%,rgba(59,130,246,0.28),rgba(8,15,33,0.95)_50%,rgba(2,6,23,1)_100%)] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-10">
        <Reveal>
          <header className="mb-10 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-blue-500/15 p-2 text-blue-300">
                <BrandLogo size={20} />
              </span>
              <div>
                <p className="font-heading text-lg leading-tight">Tracenix</p>
                <p className="text-xs text-slate-400">Construction Document & Compliance Workflow Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "text-slate-200 hover:bg-white/10 hover:text-white"
                )}
              >
                Đăng nhập
              </Link>
              <a href="#cta" className={cn(buttonVariants(), "bg-blue-500 text-white hover:bg-blue-400")}>
                Đặt lịch demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
          </header>
        </Reveal>

        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <Reveal>
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.28em] text-blue-300/95">Industrial Premium | Executive Control Center</p>
              <h1 className="max-w-3xl text-4xl font-heading font-semibold leading-tight text-white md:text-6xl">
                Quản trị hồ sơ công trình thông minh, đúng ngay từ đầu.
              </h1>
              <p className="max-w-3xl text-lg text-slate-200/95">
                Tracenix giúp doanh nghiệp xây dựng số hóa, chuẩn hóa và tự động hóa quy trình hồ sơ công trình từ tiếp
                nhận, xử lý, phê duyệt đến lưu trữ, truy vết và sẵn sàng cho nghiệm thu, thanh tra hoặc giải trình.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {heroBullets.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/45 px-3 py-2 text-sm text-slate-100"
                  >
                    <CheckCircle2 className="h-4 w-4 text-blue-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="#cta" className={cn(buttonVariants({ size: "lg" }), "bg-blue-500 text-white hover:bg-blue-400")}>
                  Đăng ký demo
                </a>
                <a
                  href="#cta"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "border-white/20 bg-transparent text-white hover:bg-white/10"
                  )}
                >
                  Yêu cầu tư vấn
                </a>
                <a
                  href="#solution"
                  className={cn(buttonVariants({ size: "lg", variant: "ghost" }), "text-slate-200 hover:bg-white/10 hover:text-white")}
                >
                  Xem cách hệ thống vận hành
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative overflow-hidden rounded-3xl border border-blue-300/20 bg-slate-950/40 p-4 shadow-[0_28px_80px_-32px_rgba(37,99,235,0.75)] md:p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(96,165,250,0.2),transparent_55%)]" />
              <div className="relative h-[360px] overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
                <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                  <ambientLight intensity={0.55} />
                  <directionalLight position={[4, 4, 3]} intensity={1.25} />
                  <TracenixGlobe radius={2.2} particlesCount={150} color="#60a5fa" speed={0.42} />
                </Canvas>
              </div>
              <div className="relative mt-4 rounded-xl border border-white/10 bg-slate-900/60 p-4">
                <p className="text-sm text-slate-300">Big Idea</p>
                <p className="mt-1 font-heading text-xl text-white">Đúng ngay từ đầu, tuân thủ mọi lúc.</p>
                <p className="mt-2 text-sm text-slate-300">Kiểm soát nhiều dự án mà không chạy theo giấy tờ.</p>
              </div>
            </div>
          </Reveal>
        </section>

        <section className="mt-24 grid gap-8 lg:grid-cols-2">
          <Reveal>
            <SectionTitle
              eyebrow="Problem"
              title="Khi hồ sơ nằm rải rác, rủi ro vận hành tăng theo cấp số nhân"
              subtitle="Nhiều doanh nghiệp vẫn quản lý hồ sơ qua email, chat, bảng tính và thư mục cá nhân. Điều này làm tăng chậm trễ, sai sót và rủi ro pháp lý khi cần đối chiếu."
            />
          </Reveal>
          <Reveal delay={0.08}>
            <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/55 p-6">
              {problemBullets.map((item) => (
                <p key={item} className="rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2 text-sm text-slate-200">
                  {item}
                </p>
              ))}
            </div>
          </Reveal>
        </section>

        <section id="solution" className="mt-24">
          <Reveal>
            <SectionTitle
              eyebrow="Solution"
              title="Một hệ điều hành hồ sơ cho doanh nghiệp xây dựng"
              subtitle="Tracenix hoạt động như lớp điều phối hồ sơ và compliance: số hóa, chuẩn hóa, tự động hóa workflow và kiểm soát readiness trên dự án thật."
            />
          </Reveal>
          <Reveal delay={0.08}>
            <div className="mt-8 grid gap-3 rounded-2xl border border-blue-300/25 bg-blue-500/10 p-6 lg:grid-cols-2">
              {solutionBullets.map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-slate-900/55 px-4 py-3 text-sm text-slate-100">
                  {item}
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="mt-24">
          <Reveal>
            <SectionTitle
              eyebrow="Capabilities"
              title="5 năng lực cốt lõi của Tracenix"
              subtitle="Tập trung đúng vào các luồng vận hành quan trọng nhất: tài liệu, workflow, compliance và truy vết."
            />
          </Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {capabilities.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={index * 0.04}>
                  <article className="h-full rounded-2xl border border-white/10 bg-slate-900/50 p-5">
                    <div className="mb-4 inline-flex rounded-lg bg-blue-500/15 p-2 text-blue-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-heading text-xl text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section className="mt-24 grid gap-8 lg:grid-cols-2">
          <Reveal>
            <SectionTitle
              eyebrow="Differentiation"
              title="Nhẹ hơn ERP, chuyên sâu hơn DMS phổ thông"
              subtitle="Tracenix không thay thế toàn bộ ERP. Tracenix tập trung đúng vào bài toán hồ sơ công trình và compliance để triển khai nhanh và kiểm soát rõ."
            />
            <div className="mt-6 space-y-3">
              {differentiation.map((item) => (
                <p key={item} className="rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-slate-200">
                  {item}
                </p>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <SectionTitle
              eyebrow="Target Customer"
              title="Dành cho đội ngũ đang phải kiểm soát nhiều dự án mà không muốn chạy theo giấy tờ"
              subtitle="Tối ưu cho doanh nghiệp xây dựng đang tăng trưởng, cần vừa tốc độ vận hành vừa chắc compliance."
            />
            <div className="mt-6 space-y-3">
              {targetCustomers.map((item) => (
                <p key={item} className="rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-slate-200">
                  {item}
                </p>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="mt-24 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <article className="rounded-2xl border border-red-200/20 bg-red-500/10 p-6">
              <h3 className="font-heading text-2xl text-white">Trước khi có Tracenix</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>Hồ sơ rời rạc, approval chậm.</li>
                <li>Sai phiên bản, thiếu compliance, khó truy vết.</li>
                <li>Đến sát nghiệm thu mới phát hiện thiếu tài liệu.</li>
              </ul>
            </article>
          </Reveal>
          <Reveal delay={0.08}>
            <article className="rounded-2xl border border-emerald-200/20 bg-emerald-500/10 p-6">
              <h3 className="font-heading text-2xl text-white">Sau khi dùng Tracenix</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>Hồ sơ tập trung, workflow rõ ràng.</li>
                <li>Ai làm gì, ở bước nào đều có dấu vết.</li>
                <li>Biết hồ sơ nào đang kẹt và kẹt ở đâu để xử lý nhanh.</li>
              </ul>
            </article>
          </Reveal>
        </section>

        <section className="mt-24 grid gap-8 lg:grid-cols-2">
          <Reveal>
            <SectionTitle
              eyebrow="Operational Value"
              title="Giá trị vận hành thấy được ngay trong dự án thật"
              subtitle="Mục tiêu không chỉ là số hóa tài liệu, mà là giảm chi phí vận hành và tăng độ sẵn sàng compliance trên từng dự án."
            />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {operationalValues.map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <SectionTitle
              eyebrow="Why Now"
              title="Thị trường đã sẵn sàng cho một lớp phần mềm chuyên biệt"
              subtitle="Áp lực pháp lý và yêu cầu vận hành đang buộc doanh nghiệp xây dựng phải chuẩn hóa hồ sơ. Công cụ phổ thông không còn đủ cho bài toán compliance và truy vết."
            />
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/55 p-6 text-sm leading-7 text-slate-200">
              Bắt đầu từ một workflow có pain rõ nhất như hồ sơ nghiệm thu, submittal, chứng chỉ vật tư hoặc hồ sơ thanh
              toán, sau đó mở rộng theo dự án và theo từng phòng ban.
            </div>
          </Reveal>
        </section>

        <section id="cta" className="mt-24">
          <Reveal>
            <div className="rounded-3xl border border-blue-300/25 bg-blue-500/10 p-8 md:p-10">
              <p className="text-xs uppercase tracking-[0.25em] text-blue-300">CTA</p>
              <h2 className="mt-3 text-3xl font-heading font-semibold text-white md:text-4xl">
                Bắt đầu từ một workflow có pain rõ nhất
              </h2>
              <p className="mt-3 max-w-3xl text-slate-200">
                Chúng tôi sẽ cùng đội ngũ của bạn xác định use case ưu tiên và triển khai pilot để đo hiệu quả thực tế trên
                hồ sơ vận hành.
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-4">
                  <h3 className="font-heading text-xl text-white">Đặt lịch demo</h3>
                  <p className="mt-1 text-sm text-slate-300">
                    Xem cách Tracenix kiểm soát hồ sơ, approval và compliance trên dự án thật.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-4">
                  <h3 className="font-heading text-xl text-white">Yêu cầu pilot</h3>
                  <p className="mt-1 text-sm text-slate-300">
                    Triển khai thử trên một nhóm hồ sơ có pain rõ để đánh giá hiệu quả trước khi mở rộng.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-4">
                  <h3 className="font-heading text-xl text-white">Nhận tư vấn use case</h3>
                  <p className="mt-1 text-sm text-slate-300">
                    Trao đổi về hồ sơ nghiệm thu, hồ sơ thanh toán, chứng chỉ vật tư hoặc checklist compliance.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className={cn(buttonVariants({ size: "lg" }), "bg-blue-500 text-white hover:bg-blue-400")}
                >
                  Vào không gian vận hành
                </Link>
                <a
                  href="mailto:hello@tracenix.com"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "border-white/20 bg-transparent text-white hover:bg-white/10"
                  )}
                >
                  Liên hệ tư vấn
                  <FileCheck2 className="ml-2 h-4 w-4" />
                </a>
              </div>
            </div>
          </Reveal>
        </section>

        <footer className="mt-12 border-t border-white/10 py-6 text-xs text-slate-400">
          Tracenix | Smart Construction Document Management & Compliance Workflow Platform
        </footer>
      </div>
    </div>
  );
}
