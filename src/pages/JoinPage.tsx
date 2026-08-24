import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SixateLogo } from '../components/common/SixateLogo';
import { MathBackground } from '../components/common/MathBackground';
import { submitRegistration, RegistrationPayload } from '../lib/firebase';
import {
  User,
  BookOpen,
  Compass,
  Wrench,
  Trophy,
  FileText,
  Link as LinkIcon,
  CheckSquare,
  ArrowRight,
  ArrowLeft,
  Upload,
  Check,
  AlertTriangle,
  Star,
  X,
  Loader2,
} from 'lucide-react';

export const JoinPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateError, setDuplicateError] = useState<{ isDuplicate: boolean; applicationId: string } | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  // Ref-level guard: prevents any concurrent duplicate submission even if React state lags
  const isSubmittingRef = useRef(false);

  // Form State
  const [formData, setFormData] = useState<RegistrationPayload>({
    fullName: '',
    rollNumber: '',
    email: '',
    phone: '',
    gender: '',
    department: 'CSE',
    departmentOther: '',
    year: '1st Year',
    section: '',
    interests: ['Algebra', 'Logical Reasoning'],
    interestsOther: '',
    mathInterestRating: 5,
    skills: ['Problem Solving'],
    skillsOther: '',
    competitionExperience: 'No',
    achievements: '',
    reasonForJoining: '',
    contribution: '',
    preferredActivities: ['Puzzle Competitions', 'Workshops'],
    linkedin: '',
    github: '',
    profilePhotoUrl: ''
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [confirmCorrect, setConfirmCorrect] = useState(false);
  const [agreeContact, setAgreeContact] = useState(true);

  // Field Options Definitions
  const departments = ['CSE', 'CSE (AI & ML)', 'CSE (Data Science)', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Other'];
  const years: ('1st Year' | '2nd Year' | '3rd Year' | '4th Year')[] = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const mathInterestsList = [
    'Algebra', 'Calculus', 'Geometry', 'Statistics', 'Probability', 
    'Number Theory', 'Discrete Mathematics', 'Logical Reasoning', 
    'Mathematical Puzzles', 'Competitive Mathematics', 'Cryptography', 'Applied Mathematics', 'Other'
  ];
  const skillsList = [
    'Problem Solving', 'Coding', 'Public Speaking', 'Event Management', 
    'Content Writing', 'Graphic Designing', 'Video Editing', 'Social Media Management', 
    'Teaching / Mentoring', 'Photography', 'Team Management', 'Other'
  ];
  const activitiesList = [
    'Mathematics Quizzes', 'Puzzle Competitions', 'Workshops', 'Mathematical Games', 
    'Coding Challenges', 'Guest Lectures', 'Competitions', 'Research / Projects', 'Other'
  ];

  // Input Handlers
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleArrayItem = (fieldName: 'interests' | 'skills' | 'preferredActivities', item: string) => {
    setFormData(prev => {
      const current = prev[fieldName];
      const exists = current.includes(item);
      const updated = exists ? current.filter(i => i !== item) : [...current, item];
      return { ...prev, [fieldName]: updated };
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setGeneralError('File size exceeds 5 MB. Please select a smaller photo.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        setFormData(prev => ({ ...prev, profilePhotoUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Step Validations
  const validateCurrentStep = (): boolean => {
    setGeneralError(null);
    if (currentStep === 1) {
      if (!formData.fullName || formData.fullName.trim().length < 3) {
        setGeneralError('Please enter your full name (at least 3 characters).');
        return false;
      }
      if (!formData.rollNumber || formData.rollNumber.trim().length < 3) {
        setGeneralError('Please enter a valid College ID / Roll Number.');
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.email && formData.email.trim() !== '' && !emailRegex.test(formData.email.trim())) {
        setGeneralError('Please enter a valid email address.');
        return false;
      }
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        setGeneralError('Please enter a valid 10-digit mobile number.');
        return false;
      }
    } else if (currentStep === 2) {
      if (formData.department === 'Other' && !formData.departmentOther?.trim()) {
        setGeneralError('Please specify your department name.');
        return false;
      }
    } else if (currentStep === 3) {
      if (formData.interests.length === 0) {
        setGeneralError('Please select at least one area of Mathematics.');
        return false;
      }
    } else if (currentStep === 4) {
      if (formData.skills.length === 0) {
        setGeneralError('Please select at least one skill.');
        return false;
      }
    } else if (currentStep === 5) {
      if (formData.competitionExperience === 'Yes' && !formData.achievements?.trim()) {
        setGeneralError('Please describe your competition achievements.');
        return false;
      }
    }
    // Step 6 (About You) is completely optional
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 8));
    }
  };

  const handlePrev = () => {
    setGeneralError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Hard guard: prevents any concurrent/double submission
    if (isSubmittingRef.current) return;

    if (!confirmCorrect) {
      setGeneralError('You must confirm that the information provided is correct.');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setGeneralError(null);

    try {
      const result = await submitRegistration(formData);
      navigate('/join/success', {
        state: {
          applicationId: result.applicationId,
          fullName:      formData.fullName,
          email:         formData.email,
        },
      });
    } catch (err: any) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      if (err && err.isDuplicate) {
        setDuplicateError({ isDuplicate: true, applicationId: err.applicationId || 'SIXATE-2026-REG' });
      } else {
        setGeneralError(err.message || 'Registration could not be submitted. Please try again.');
      }
    }
  };

  const steps = [
    { num: 1, label: 'Personal', icon: User },
    { num: 2, label: 'Academic', icon: BookOpen },
    { num: 3, label: 'Interests', icon: Compass },
    { num: 4, label: 'Skills', icon: Wrench },
    { num: 5, label: 'Experience', icon: Trophy },
    { num: 6, label: 'About You', icon: FileText },
    { num: 7, label: 'Optional', icon: LinkIcon },
    { num: 8, label: 'Submit', icon: CheckSquare },
  ];

  return (
    <div className="min-h-screen bg-sixate-dark text-slate-100 flex flex-col justify-between relative selection:bg-sixate-purple selection:text-white">
      <MathBackground />

      {/* Header Bar */}
      <header className="relative z-20 border-b border-sixate-purple/20 bg-sixate-navy/80 backdrop-blur-md py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/">
            <SixateLogo size="md" />
          </Link>
          <Link
            to="/"
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Registration Card */}
      <main className="relative z-10 flex-grow py-8 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">

          {/* Form Header Banner */}
          <div className="text-center space-y-3 mb-8">
            <h1 className="font-heading font-black text-3xl sm:text-5xl text-white tracking-tight">
              BECOME A PART OF <span className="text-transparent bg-clip-text bg-gradient-to-r from-sixate-purple via-sixate-violet to-sixate-green">SIXATE</span>
            </h1>
            <p className="font-body italic text-sixate-green text-sm sm:text-base font-semibold">
              "Like 6 & 8, be a part of perfection."
            </p>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Join the SIXATE Mathematics Club and become part of a community that thinks, solves, and discovers together.
            </p>
          </div>

          {/* Step Progress Indicator Bar */}
          <div className="mb-8 p-4 rounded-2xl bg-sixate-card/80 border border-sixate-purple/20 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between overflow-x-auto gap-2 pb-2 scrollbar-none">
              {steps.map((step) => {
                const Icon = step.icon;
                const isActive = currentStep === step.num;
                const isCompleted = currentStep > step.num;
                return (
                  <div 
                    key={step.num} 
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 shrink-0 ${
                      isActive 
                        ? 'bg-sixate-purple text-white shadow-lg shadow-sixate-purple/30 font-bold scale-105' 
                        : isCompleted
                        ? 'bg-sixate-green/15 text-sixate-green border border-sixate-green/30'
                        : 'bg-slate-800/40 text-slate-400'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                      isActive ? 'bg-white text-sixate-purple' : isCompleted ? 'bg-sixate-green text-slate-900' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : `0${step.num}`}
                    </div>
                    <span className="text-xs font-heading hidden sm:inline">{step.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-sixate-violet via-sixate-purple to-sixate-green h-full transition-all duration-300"
                style={{ width: `${(currentStep / 8) * 100}%` }}
              />
            </div>
          </div>

          {/* General Error Banner */}
          {generalError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-medium flex items-center gap-3 animate-shake">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Form Body Container */}
          <div className="p-6 sm:p-10 rounded-3xl bg-sixate-card/90 border border-sixate-purple/30 backdrop-blur-xl shadow-2xl space-y-8">

            {/* STEP 1: Personal Details */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="font-heading font-extrabold text-xl text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-sixate-green" /> STEP 1 — Personal Details
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Provide your basic contact and identifier information.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-heading font-semibold text-slate-200">
                      Full Name <span className="text-sixate-green">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleTextChange}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-sixate-purple focus:ring-1 focus:ring-sixate-purple text-sm font-body"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-heading font-semibold text-slate-200">
                      College ID / Roll Number <span className="text-sixate-green">*</span>
                    </label>
                    <input
                      type="text"
                      name="rollNumber"
                      value={formData.rollNumber}
                      onChange={handleTextChange}
                      placeholder="e.g. 22A01CSE"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-sixate-purple focus:ring-1 focus:ring-sixate-purple text-sm font-body uppercase"
                      required
                    />
                    <p className="text-[10px] text-slate-400">Unique identifier used for single registration security.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-heading font-semibold text-slate-200">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleTextChange}
                      placeholder="e.g. aarav.sharma@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-sixate-purple focus:ring-1 focus:ring-sixate-purple text-sm font-body"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-heading font-semibold text-slate-200">
                      Phone Number <span className="text-sixate-green">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleTextChange}
                      placeholder="e.g. +91 9876543210"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-sixate-purple focus:ring-1 focus:ring-sixate-purple text-sm font-body"
                      required
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-heading font-semibold text-slate-200">Gender</label>
                    <div className="flex flex-wrap gap-4 pt-1">
                      {['Male', 'Female', 'Prefer not to say'].map((g) => (
                        <label key={g} className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                          <input
                            type="radio"
                            name="gender"
                            value={g}
                            checked={formData.gender === g}
                            onChange={handleTextChange}
                            className="text-sixate-purple focus:ring-sixate-purple bg-slate-900 border-slate-700"
                          />
                          {g}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Academic Details */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="font-heading font-extrabold text-xl text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-sixate-purple" /> STEP 2 — Academic Details
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Specify your current department, year, and section.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-heading font-semibold text-slate-200">
                      Department / Branch <span className="text-sixate-green">*</span>
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleTextChange}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sixate-purple text-sm font-body"
                    >
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  {formData.department === 'Other' && (
                    <div className="space-y-2">
                      <label className="text-xs font-heading font-semibold text-slate-200">
                        Enter Department Name <span className="text-sixate-green">*</span>
                      </label>
                      <input
                        type="text"
                        name="departmentOther"
                        value={formData.departmentOther}
                        onChange={handleTextChange}
                        placeholder="e.g. Aerospace Engineering"
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-body"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-heading font-semibold text-slate-200">
                      Year <span className="text-sixate-green">*</span>
                    </label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleTextChange}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sixate-purple text-sm font-body"
                    >
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-heading font-semibold text-slate-200">Section (Optional)</label>
                    <input
                      type="text"
                      name="section"
                      value={formData.section}
                      onChange={handleTextChange}
                      placeholder="e.g. A / B / C"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-body"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Mathematics Interest */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="font-heading font-extrabold text-xl text-white flex items-center gap-2">
                    <Compass className="w-5 h-5 text-sixate-green" /> STEP 3 — Mathematics Interest
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Select the areas of Mathematics that excite you most.</p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-heading font-semibold text-slate-200">
                    Which areas of Mathematics interest you? (Multi-select) <span className="text-sixate-green">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {mathInterestsList.map((item) => {
                      const isSelected = formData.interests.includes(item);
                      return (
                        <button
                          type="button"
                          key={item}
                          onClick={() => toggleArrayItem('interests', item)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all duration-200 flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-sixate-purple/25 border-sixate-purple text-white shadow-md'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-sixate-green" />}
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formData.interests.includes('Other') && (
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-heading font-semibold text-slate-200">Specify Other Interest</label>
                    <input
                      type="text"
                      name="interestsOther"
                      value={formData.interestsOther}
                      onChange={handleTextChange}
                      placeholder="e.g. Topology, Chaos Theory"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                    />
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <label className="text-xs font-heading font-semibold text-slate-200">
                    How interested are you in Mathematics? (1–5 Rating) <span className="text-sixate-green">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFormData(prev => ({ ...prev, mathInterestRating: star }))}
                        className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-1 ${
                          formData.mathInterestRating >= star
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 scale-105'
                            : 'bg-slate-900 border-slate-800 text-slate-600'
                        }`}
                      >
                        <Star className={`w-6 h-6 ${formData.mathInterestRating >= star ? 'fill-amber-400' : ''}`} />
                        <span className="text-[10px] font-bold font-mono">{star}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Skills */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="font-heading font-extrabold text-xl text-white flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-sixate-purple" /> STEP 4 — Skills
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">What skills can you contribute to SIXATE activities?</p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-heading font-semibold text-slate-200">
                    What skills can you contribute to SIXATE? (Multi-select) <span className="text-sixate-green">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {skillsList.map((skill) => {
                      const isSelected = formData.skills.includes(skill);
                      return (
                        <button
                          type="button"
                          key={skill}
                          onClick={() => toggleArrayItem('skills', skill)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all duration-200 flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-sixate-green/20 border-sixate-green text-white shadow-md'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-sixate-green" />}
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formData.skills.includes('Other') && (
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-heading font-semibold text-slate-200">Specify Other Skill</label>
                    <input
                      type="text"
                      name="skillsOther"
                      value={formData.skillsOther}
                      onChange={handleTextChange}
                      placeholder="e.g. Data Analysis, LaTeX typesetting"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                    />
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: Experience */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="font-heading font-extrabold text-xl text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-sixate-green" /> STEP 5 — Experience
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Tell us about any past academic or math competition experience.</p>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-heading font-semibold text-slate-200">
                    Have you participated in any mathematics, technical, or academic competitions? <span className="text-sixate-green">*</span>
                  </label>
                  <div className="flex gap-4">
                    {['Yes', 'No'].map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => setFormData(prev => ({ ...prev, competitionExperience: opt as 'Yes' | 'No' }))}
                        className={`px-6 py-2.5 rounded-xl font-heading font-bold text-sm border transition-all ${
                          formData.competitionExperience === opt
                            ? 'bg-sixate-purple text-white border-sixate-purple shadow-lg'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.competitionExperience === 'Yes' && (
                  <div className="space-y-2 pt-4 border-t border-slate-800">
                    <label className="text-xs font-heading font-semibold text-slate-200">
                      Tell us about your participation or achievement <span className="text-sixate-green">*</span>
                    </label>
                    <textarea
                      name="achievements"
                      value={formData.achievements}
                      onChange={handleTextChange}
                      rows={3}
                      placeholder="e.g. Secured 2nd place in Regional Science & Math Olympiad 2025..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sixate-purple"
                    />
                  </div>
                )}
              </div>
            )}

            {/* STEP 6: About the Student */}
            {currentStep === 6 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="font-heading font-extrabold text-xl text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-sixate-purple" /> STEP 6 — About You (Optional)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Share your motivations and what activities you'd like to see (Optional).</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-heading font-semibold text-slate-200">
                      Why do you want to join SIXATE? (Optional)
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      {formData.reasonForJoining.trim().length} / 1000 chars
                    </span>
                  </div>
                  <textarea
                    name="reasonForJoining"
                    value={formData.reasonForJoining}
                    onChange={handleTextChange}
                    rows={4}
                    placeholder="Tell us what drives your passion for mathematics and what you hope to achieve as a SIXATE member (Optional)..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sixate-purple"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-heading font-semibold text-slate-200">
                    What can you contribute to SIXATE? (Optional)
                  </label>
                  <textarea
                    name="contribution"
                    value={formData.contribution}
                    onChange={handleTextChange}
                    rows={2}
                    placeholder="e.g. I can assist in creating quiz questions and managing workshop setups..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sixate-purple"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-xs font-heading font-semibold text-slate-200">
                    What activities would you like SIXATE to organize? (Multi-select)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {activitiesList.map((act) => {
                      const isSelected = formData.preferredActivities.includes(act);
                      return (
                        <button
                          type="button"
                          key={act}
                          onClick={() => toggleArrayItem('preferredActivities', act)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            isSelected
                              ? 'bg-sixate-violet/30 border-sixate-violet text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          {act}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: Optional Information */}
            {currentStep === 7 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="font-heading font-extrabold text-xl text-white flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-sixate-green" /> STEP 7 — Optional Details
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Add your social profiles and upload a profile photo if desired.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-heading font-semibold text-slate-200">LinkedIn Profile URL</label>
                    <input
                      type="url"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleTextChange}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-heading font-semibold text-slate-200">GitHub Profile URL</label>
                    <input
                      type="url"
                      name="github"
                      value={formData.github}
                      onChange={handleTextChange}
                      placeholder="https://github.com/yourusername"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <label className="text-xs font-heading font-semibold text-slate-200">
                    Profile Photo (Optional — JPG/PNG, max 5 MB)
                  </label>
                  
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Profile Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-slate-600" />
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-slate-200 cursor-pointer inline-flex items-center gap-2">
                        <Upload className="w-4 h-4 text-sixate-green" /> Upload Photo
                        <input
                          type="file"
                          accept="image/png, image/jpeg"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                      {photoPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPreview(null);
                            setFormData(prev => ({ ...prev, profilePhotoUrl: '' }));
                          }}
                          className="block text-[11px] text-rose-400 hover:underline"
                        >
                          Remove Photo
                        </button>
                      )}
                      <p className="text-[10px] text-slate-500">Image will be saved with your membership record.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 8: Review & Consent */}
            {currentStep === 8 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="font-heading font-extrabold text-xl text-white flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-sixate-purple" /> STEP 8 — Confirmation & Consent
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Review your details before submitting your SIXATE application.</p>
                </div>

                {/* Summary Box */}
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-slate-400">Name</p>
                      <p className="font-bold text-white">{formData.fullName}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Roll Number</p>
                      <p className="font-bold text-sixate-green">{formData.rollNumber}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Department</p>
                      <p className="font-bold text-white">{formData.department}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Year</p>
                      <p className="font-bold text-white">{formData.year}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Email</p>
                      <p className="font-bold text-white truncate">{formData.email}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Phone</p>
                      <p className="font-bold text-white">{formData.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Consent Checkboxes */}
                <div className="space-y-4 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-200">
                    <input
                      type="checkbox"
                      checked={confirmCorrect}
                      onChange={(e) => setConfirmCorrect(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-sixate-purple focus:ring-sixate-purple bg-slate-900 border-slate-700"
                    />
                    <span>
                      <strong className="text-white">I confirm that the information provided is correct.</strong> <span className="text-sixate-green">*</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={agreeContact}
                      onChange={(e) => setAgreeContact(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-sixate-purple focus:ring-sixate-purple bg-slate-900 border-slate-700"
                    />
                    <span>I agree to be contacted by SIXATE regarding my membership/application activities.</span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation & Submit Buttons */}
            <div className="pt-6 border-t border-slate-800 flex items-center justify-between gap-4">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-5 py-3 rounded-xl font-heading font-semibold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Previous
                </button>
              ) : <div />}

              {currentStep < 8 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 rounded-xl font-heading font-bold text-xs text-white bg-gradient-to-r from-sixate-violet via-sixate-purple to-sixate-green shadow-lg hover:shadow-sixate-purple/20 flex items-center gap-2 ml-auto"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !confirmCorrect}
                  aria-busy={isSubmitting}
                  className="px-8 py-3.5 rounded-xl font-heading font-bold text-sm text-white bg-gradient-to-r from-sixate-violet via-sixate-purple to-sixate-green shadow-xl shadow-sixate-green/30 hover:scale-[1.02] disabled:opacity-60 disabled:pointer-events-none disabled:cursor-not-allowed flex items-center gap-2 ml-auto transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      SUBMITTING APPLICATION…
                    </>
                  ) : (
                    'JOIN SIXATE →'
                  )}
                </button>
              )}
            </div>

          </div>

        </div>
      </main>

      {/* Duplicate Registration Warning Modal (§22) */}
      {duplicateError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-sixate-card border border-rose-500/40 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-heading font-black text-xl text-white tracking-tight">
                YOU HAVE ALREADY REGISTERED WITH SIXATE
              </h3>
              <p className="text-xs text-slate-300">
                A registration matching this College Roll Number or Email already exists in the SIXATE database.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Your Application ID</p>
              <p className="font-heading font-black text-xl text-sixate-green mt-1">
                {duplicateError.applicationId}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                to="/"
                className="w-full py-3 rounded-xl font-heading font-bold text-xs text-white bg-sixate-purple hover:bg-sixate-violet"
              >
                RETURN TO HOME PAGE
              </Link>
              <button
                type="button"
                onClick={() => setDuplicateError(null)}
                className="w-full py-2 text-xs text-slate-400 hover:text-white"
              >
                Close & Review Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} SIXATE Mathematics Club · Student Registration Portal</p>
      </footer>
    </div>
  );
};
