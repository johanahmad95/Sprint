"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, Upload, X } from "lucide-react"

// Keep in sync with courts.sport_type enum (capitalized values)
const SPORT_OPTIONS = ["Padel", "Pickleball", "Futsal", "Badminton", "Tennis"]

// Klang Valley areas – values must match Supabase enum klang_valley_area
const AREA_OPTIONS: { value: string; label: string }[] = [
  { value: "kuala-lumpur", label: "Kuala Lumpur" },
  { value: "petaling-jaya", label: "Petaling Jaya" },
  { value: "damansara", label: "Damansara" },
  { value: "mont-kiara", label: "Mont Kiara" },
  { value: "bangsar", label: "Bangsar" },
  { value: "subang", label: "Subang" },
  { value: "shah-alam", label: "Shah Alam" },
  { value: "puchong", label: "Puchong" },
]

// Saved as text[] in courts.amenities
const AMENITIES_LIST = [
  "Parking",
  "Showers",
  "Equipment Rental",
  "Coaching",
  "Cafe",
]

export function AddCourtForm() {
  const router = useRouter()
  
  // SECTION A: IDENTITY & LOCATION
  const [name, setName] = useState("")
  const [venueName, setVenueName] = useState("")
  const [area, setArea] = useState("")
  const [sport, setSport] = useState(SPORT_OPTIONS[0] ?? "")
  const [address, setAddress] = useState("")
  const [isIndoor, setIsIndoor] = useState(false)
  const [isActive, setIsActive] = useState(true)

  // Venue grouping options for this vendor
  const [venueOptions, setVenueOptions] = useState<string[]>([])
  const [venueOptionsLoading, setVenueOptionsLoading] = useState(false)
  const [useNewVenue, setUseNewVenue] = useState(false)

  // SECTION B: ABOUT & FEATURES
  const [description, setDescription] = useState("")
  const [amenities, setAmenities] = useState<string[]>([])

  // SECTION C: PRICING & SCHEDULE
  const [hourlyRate, setHourlyRate] = useState("")
  const [peakRate, setPeakRate] = useState("")
  const [peakHours, setPeakHours] = useState("")
  const [openingHour, setOpeningHour] = useState("07:00")
  const [closingHour, setClosingHour] = useState("23:00")
  const [is24Hours, setIs24Hours] = useState(false)

  // SECTION D: PHOTOS
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load unique venue names for the logged-in vendor
  useEffect(() => {
    const loadVenueOptions = async () => {
      setVenueOptionsLoading(true)
      try {
        const supabase = createClient()
        // Fetch active venues directly from venues table so the dropdown
        // does not depend on auth token health of other requests.
        const { data, error } = await supabase
          .from("venues")
          .select("name")
          .eq("is_active", true)

        if (error) {
          console.error("Error loading venues for dropdown:", error)
          setVenueOptions([])
        } else if (data) {
          const uniqueNames = Array.from(
            new Set(
              (data as { name: string | null }[])
                .map((row) => row.name?.trim())
                .filter((name): name is string => !!name),
            ),
          )
          console.log("Loaded venues for dropdown:", uniqueNames)
          setVenueOptions(uniqueNames)
        } else {
          setVenueOptions([])
        }
      } catch (err) {
        console.error("Failed to load venue options:", err)
        setVenueOptions([])
      } finally {
        setVenueOptionsLoading(false)
      }
    }

    loadVenueOptions()
  }, [])

  const handleAmenityToggle = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    )
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setSelectedFiles((prev) => [...prev, ...newFiles])

      // Generate preview URLs
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file))
      setPreviewUrls((prev) => [...prev, ...newPreviews])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviewUrls((prev) => {
      // Revoke the URL to avoid memory leaks
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  /** Reset all form fields to initial state after successful save */
  const resetForm = () => {
    setName("")
    setVenueName("")
    setUseNewVenue(false)
    setArea("")
    setSport(SPORT_OPTIONS[0] ?? "")
    setAddress("")
    setIsIndoor(false)
    setIsActive(true)
    setDescription("")
    setAmenities([])
    setHourlyRate("")
    setPeakRate("")
    setPeakHours("")
    setOpeningHour("07:00")
    setClosingHour("23:00")
    setIs24Hours(false)
    setSelectedFiles([])
    setPreviewUrls((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url))
      return []
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // ── Validation ──────────────────────────────────────────────────────────
    const trimmedVenueName = venueName.trim()

    if (!name.trim() || !trimmedVenueName || !sport || !hourlyRate) {
      toast.error("Please fill in all required fields (Name, Venue, Sport, Hourly Rate).")
      return
    }
    if (useNewVenue && !area.trim()) {
      toast.error("Please select an Area for the new venue.")
      return
    }

    const numericHourlyRate = Number(hourlyRate)
    const numericPeakRate = peakRate ? Number(peakRate) : null

    if (Number.isNaN(numericHourlyRate) || numericHourlyRate < 0) {
      toast.error("Hourly rate must be a positive number.")
      return
    }
    if (numericPeakRate !== null && (Number.isNaN(numericPeakRate) || numericPeakRate < 0)) {
      toast.error("Peak rate must be a positive number.")
      return
    }

    // ── Helper: convert HH:MM (or HH:MM:SS) to HH:MM:SS ────────────────────
    const formatTime = (t: string): string => {
      if (!t) return "00:00:00"
      const parts = t.split(":")
      const hh = (parts[0] ?? "00").padStart(2, "0")
      const mm = (parts[1] ?? "00").padStart(2, "0")
      const ss = (parts[2] ?? "00").padStart(2, "0")
      return `${hh}:${mm}:${ss}`
    }

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      // ── 1. Auth ────────────────────────────────────────────────────────────
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error("Auth failed:", authError?.message ?? "No user")
        alert("Please log in again.")
        toast.error("Session expired. Please log in again.")
        return
      }

      // ── 2. Image upload ────────────────────────────────────────────────────
      const uploadedImageUrls: string[] = []
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const fileName = `${Date.now()}-${i}-${file.name}`
        const { error: uploadError } = await supabase.storage
          .from("court-images")
          .upload(fileName, file)

        if (uploadError) {
          console.error("Image upload failed:", uploadError)
          toast.error(`Failed to upload image: ${file.name}`)
          return
        }
        const { data: { publicUrl } } = supabase.storage
          .from("court-images")
          .getPublicUrl(fileName)
        uploadedImageUrls.push(publicUrl)
      }

      // ── 3. New Venue chain: insert venue first, then capture its id ────────
      let finalVenueId: string | null = null

      if (useNewVenue) {
        const slug =
          trimmedVenueName
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "") || `venue-${Date.now()}`

        console.log("Creating new venue:", { name: trimmedVenueName, slug })

        const { data: newVenueData, error: newVenueError } = await supabase
          .from("venues")
          .insert({
            name: trimmedVenueName,
            slug,
            address: address.trim() || "Address to be updated",
            area: area.trim() || "kuala-lumpur",
            location: address.trim() || "Klang Valley",
            owner_id: user.id,
            vendor_id: user.id,
            is_active: true,
          })
          .select("id")
          .single()

        if (newVenueError) {
          const msg = newVenueError.message ?? JSON.stringify(newVenueError)
          console.error("Venue insert error:", newVenueError)
          alert(msg)
          toast.error(`Venue creation failed: ${msg}`)
          return
        }

        finalVenueId = newVenueData?.id ?? null
        console.log("New venue id:", finalVenueId)

      } else if (trimmedVenueName) {
        const { data: venueData, error: venueFetchError } = await supabase
          .from("venues")
          .select("id")
          .eq("name", trimmedVenueName)
          .eq("owner_id", user.id)
          .single()

        if (venueFetchError && venueFetchError.code !== "PGRST116") {
          console.error("Venue lookup error:", venueFetchError)
        }
        finalVenueId = venueData?.id ?? null
        console.log("Existing venue id:", finalVenueId)
      }

      // ── 4. Build court payload – exact DB column names ────────────────────
      const openingTimeToSave = is24Hours ? "00:00:00" : formatTime(openingHour)
      const closingTimeToSave = is24Hours ? "23:59:59" : formatTime(closingHour)

      const courtPayload: Record<string, unknown> = {
        name: name.trim(),                                        // Court Name → name
        sport: sport,
        venue_name: trimmedVenueName,
        hourly_rate: Number(numericHourlyRate),                   // Standard Rate → hourly_rate (Numeric)
        peak_rate: numericPeakRate !== null ? Number(numericPeakRate) : null,
        is_indoor: isIndoor,                                      // Indoor Court → is_indoor
        is_active: isActive,                                      // Active toggle → is_active
        amenities: Array.isArray(amenities) ? amenities : [],
        image_url: uploadedImageUrls,
        description: description.trim(),
        address: address.trim(),
        peak_hours: peakHours.trim(),
        opening_hour: openingTimeToSave,                          // "HH:MM:SS"
        closing_hour: closingTimeToSave,                          // "HH:MM:SS"
        status: "pending",
        vendor_id: user.id,
      }

      if (finalVenueId) {
        courtPayload.venue_id = finalVenueId
      }

      console.log("Inserting court:", courtPayload)

      // ── 5. Insert court ───────────────────────────────────────────────────
      const { error: insertError } = await supabase.from("courts").insert(courtPayload)

      if (insertError) {
        console.error("Court insert error:", insertError)
        alert(insertError.message)
        toast.error(insertError.message || "Failed to create court.")
        return
      }

      // ── Success ───────────────────────────────────────────────────────────
      toast.success("Court submitted for admin approval.")
      resetForm()
      router.refresh()
      router.push("/vendor/dashboard/courts")

    } catch (err: any) {
      const msg = err?.message ?? err?.details ?? "Unknown error"
      console.error("Unexpected error:", msg, err)
      alert(`Unexpected error: ${msg}`)
      toast.error(msg || "Unexpected error creating court.")
    } finally {
      // Always runs – ensures the button never stays stuck
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-gray-100 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Court Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SECTION A: IDENTITY & LOCATION */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider border-b pb-2">
              Identity & Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="court-name">Court Name *</Label>
                <Input
                  id="court-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Court 1"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sport">Sport Type *</Label>
                <select
                  id="sport"
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]"
                  required
                >
                  {SPORT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="venue-select">Venue *</Label>
                <select
                  id="venue-select"
                  value={useNewVenue ? "__NEW__" : venueName}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === "__NEW__") {
                      setUseNewVenue(true)
                      setVenueName("")
                    } else {
                      setUseNewVenue(false)
                      setVenueName(value)
                    }
                  }}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]"
                  disabled={venueOptionsLoading}
                  required
                >
                  <option value="">{venueOptionsLoading ? "Loading venues..." : "Select an existing venue"}</option>
                  <option value="__NEW__">+ Add New Venue</option>
                  {venueOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {useNewVenue && (
                  <div className="mt-2 space-y-1.5">
                    <Label htmlFor="venue-new" className="text-xs text-gray-600">
                      New Venue Name (e.g., The Picklers KL)
                    </Label>
                    <Input
                      id="venue-new"
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      placeholder="Type the new venue name"
                      className="w-full"
                      required
                    />
                    <Label htmlFor="venue-area" className="text-xs text-gray-600">
                      Area *
                    </Label>
                    <select
                      id="venue-area"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]"
                      required
                    >
                      <option value="">Select area (e.g. Subang, PJ, KL)</option>
                      {AREA_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Select an existing venue to keep courts grouped, or choose &quot;+ Add New Venue&quot; to start a new location.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Court specific address (optional)"
                />
              </div>
            </div>

            <div className="flex items-center gap-8 pt-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-indoor"
                  checked={isIndoor}
                  onCheckedChange={setIsIndoor}
                  className="data-[state=checked]:bg-[#FF6B35]"
                />
                <Label htmlFor="is-indoor" className="cursor-pointer">Indoor Court</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  className="data-[state=checked]:bg-[#FF6B35]"
                />
                <div>
                  <Label htmlFor="is-active" className="cursor-pointer">Active</Label>
                  <p className="text-xs text-gray-500">
                    Court will not be public until approved by admin.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION B: ABOUT & FEATURES */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider border-b pb-2">
              About & Features
            </h3>
            
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]"
                placeholder="Describe the court surface, lighting, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {AMENITIES_LIST.map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`amenity-${amenity}`}
                      checked={amenities.includes(amenity)}
                      onChange={() => handleAmenityToggle(amenity)}
                      className="h-4 w-4 rounded border-gray-300 text-[#FF6B35] focus:ring-[#FF6B35]"
                    />
                    <label
                      htmlFor={`amenity-${amenity}`}
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      {amenity}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION C: PRICING & SCHEDULE */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider border-b pb-2">
              Pricing & Schedule
            </h3>

            <div className="flex items-center gap-2">
              <Switch
                id="is-24-hours"
                checked={is24Hours}
                onCheckedChange={setIs24Hours}
                className="data-[state=checked]:bg-[#FF6B35]"
              />
              <Label htmlFor="is-24-hours" className="cursor-pointer">
                Open 24 Hours
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="hourly-rate">Standard Rate (/hr) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="hourly-rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="pl-7"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="peak-rate">Peak Rate (/hr)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="peak-rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={peakRate}
                    onChange={(e) => setPeakRate(e.target.value)}
                    className="pl-7"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="peak-hours">Peak Hours</Label>
                <Input
                  id="peak-hours"
                  value={peakHours}
                  onChange={(e) => setPeakHours(e.target.value)}
                  placeholder="e.g. 18:00-22:00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="opening-hour">Opening Time</Label>
                <Input
                  id="opening-hour"
                  type="time"
                  value={openingHour}
                  onChange={(e) => setOpeningHour(e.target.value)}
                  disabled={is24Hours}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="closing-hour">Closing Time</Label>
                <Input
                  id="closing-hour"
                  type="time"
                  value={closingHour}
                  onChange={(e) => setClosingHour(e.target.value)}
                  disabled={is24Hours}
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION D: PHOTOS */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider border-b pb-2">
              Photos
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG or WEBP (MAX. 5MB)
                    </p>
                  </div>
                  <input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>

              {previewUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={url} className="relative aspect-video group">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto bg-[#FF6B35] hover:bg-[#E55A2B] text-white min-w-[150px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Court...
                </>
              ) : (
                "Create Court"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
