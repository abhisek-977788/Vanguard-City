import {
  Droplets, Building2, CreditCard, FileText,
  Briefcase, Waves, Construction, Lightbulb, Home,
  Clock, IndianRupee, FileCheck, AlertCircle,
} from 'lucide-react'
import { useState } from 'react'

interface Service {
  id: string
  icon: React.ElementType
  name: string
  description: string
  documents: string[]
  processingTime: string
  fee: string | null
  dept: string
  iconBg: string
  iconColor: string
}

const services: Service[] = [
  {
    id: 'water-connection',
    icon: Droplets,
    name: 'Water Connection Application',
    description: 'Apply for a new domestic or commercial water supply connection from the municipal network.',
    documents: ['Identity proof (Aadhaar/Voter ID)', 'Property ownership/lease document', 'Site plan / location sketch'],
    processingTime: '15–20 working days',
    fee: '₹1,200',
    dept: 'Water Supply Department',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'building-permit',
    icon: Building2,
    name: 'Building Permit Request',
    description: 'Obtain approval for new construction, extension, or renovation of existing structures.',
    documents: ['Completed BP-01 application form', 'Architect-certified site and floor plan', 'Structural stability certificate'],
    processingTime: '15–30 working days',
    fee: '₹500 + ₹10/sq.ft',
    dept: 'Town Planning & Engineering',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-700',
  },
  {
    id: 'property-tax',
    icon: CreditCard,
    name: 'Property Tax Payment',
    description: 'Pay annual property tax for residential or commercial holdings within municipal limits.',
    documents: ['Property Tax Assessment Number', 'Previous year payment receipt', 'Property ownership document'],
    processingTime: 'Instant (online)',
    fee: 'As per assessment',
    dept: 'Revenue Department',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    id: 'birth-death-cert',
    icon: FileText,
    name: 'Birth / Death Certificate',
    description: 'Apply for or obtain certified copies of birth or death certificates registered with the corporation.',
    documents: ['Hospital discharge summary / death report', 'Identity proof of applicant', 'Filled application form (BD-03)'],
    processingTime: '3–7 working days',
    fee: '₹50 per copy',
    dept: 'Civil Registration Office',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
  {
    id: 'trade-license',
    icon: Briefcase,
    name: 'Trade License Application',
    description: 'Obtain a trade license required to legally operate commercial establishments within city limits.',
    documents: ['Identity proof of proprietor/partner', 'Premises ownership / lease agreement', 'NOC from Fire & Safety department'],
    processingTime: '10–15 working days',
    fee: '₹750 – ₹5,000 (category-wise)',
    dept: 'Licensing & Revenue',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    id: 'drainage-connection',
    icon: Waves,
    name: 'Drainage Connection',
    description: 'Apply for connecting your property to the underground sewerage and drainage network.',
    documents: ['Property document / Building permit copy', 'Site plan showing drain outlet', 'Identity proof of applicant'],
    processingTime: '10–20 working days',
    fee: '₹800',
    dept: 'Water Supply & Sewerage',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
  },
  {
    id: 'road-cutting',
    icon: Construction,
    name: 'Road Cutting Permission',
    description: 'Obtain permission for temporary road cutting for utility installation or repair work.',
    documents: ['Application on company/dept letterhead', 'Detailed work plan and timeline', 'Security deposit proof'],
    processingTime: '5–10 working days',
    fee: '₹2,500 + restoration deposit',
    dept: 'Roads & Infrastructure',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    id: 'street-light',
    icon: Lightbulb,
    name: 'Street Light Complaint',
    description: 'Report non-functional, damaged, or missing street lights in your area for prompt rectification.',
    documents: ['Complaint application / Online submission', 'Photograph of affected area (optional)', 'Location / ward details'],
    processingTime: '3–5 working days',
    fee: null,
    dept: 'Electrical Department',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
  },
  {
    id: 'property-mutation',
    icon: Home,
    name: 'Property Mutation',
    description: 'Transfer property tax records to a new owner following sale, inheritance, or gift deed.',
    documents: ['Registered sale deed / gift deed / will', 'Death certificate (if inheritance)', 'Identity & address proof of new owner'],
    processingTime: '20–30 working days',
    fee: '₹200',
    dept: 'Revenue Department',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
  },
]

export default function CivicServicesPage() {
  const [tooltip, setTooltip] = useState<string | null>(null)

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Civic Services</h1>
          <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
            Access information about municipal services. Apply online or visit the relevant department office.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 max-w-4xl mx-auto">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">
            <span className="font-semibold">Disclaimer:</span> Service information is for guidance only.
            Visit the municipal office or official website for the latest requirements, fees, and procedures.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-11 h-11 ${svc.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <svc.icon className={`w-6 h-6 ${svc.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm leading-snug">{svc.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{svc.dept}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{svc.description}</p>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col gap-4">
                {/* Documents */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <FileCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Required Documents</span>
                  </div>
                  <ul className="space-y-1">
                    {svc.documents.map((doc) => (
                      <li key={doc} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                        {doc}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-3 mt-auto">
                  <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 rounded-lg px-2.5 py-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium">{svc.processingTime}</span>
                  </div>
                  {svc.fee ? (
                    <div className="flex items-center gap-1.5 bg-green-50 text-green-700 rounded-lg px-2.5 py-1.5">
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">{svc.fee}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-slate-50 text-slate-500 rounded-lg px-2.5 py-1.5">
                      <span className="text-[11px] font-medium">No Fee</span>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-2 mt-2">
                  <div className="relative flex-1">
                    <button
                      className="w-full px-3 py-2 bg-blue-100 text-blue-400 text-xs font-semibold rounded-lg cursor-not-allowed select-none"
                      onMouseEnter={() => setTooltip(svc.id)}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      Apply Online
                    </button>
                    {tooltip === svc.id && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-[11px] rounded-lg whitespace-nowrap shadow-lg z-10">
                        Coming Soon
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45 -mt-1" />
                      </div>
                    )}
                  </div>
                  <button className="flex-1 px-3 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors">
                    Visit Office
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 mt-10">
          For assistance, contact the Citizen Help Desk: <strong className="text-slate-600">1800-123-4567</strong> (Mon–Sat, 9am–6pm)
        </p>
      </div>
    </div>
  )
}
