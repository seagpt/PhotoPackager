# PhotoPackager Web Edition - Complete UI Test Checklist

## 🔘 Buttons to Test

### Primary Action Buttons
- [ ] **"Select Folder"** button (dropZone)
- [ ] **"Start Processing"** button (configPanel) 
- [ ] **"Download Complete Package"** button (completionPanel)
- [ ] **"Process Another Folder"** button (completionPanel)

### Hidden File Input
- [ ] **Folder Input** (webkitdirectory) - triggered by Select Folder button

## ☑️ Checkboxes to Test

### File Inclusion Options
- [ ] **"Include Original Files"** checkbox
- [ ] **"Include RAW Files"** checkbox

### Output Format Generation
- [ ] **"Generate Optimized JPG"** checkbox
- [ ] **"Generate Optimized WebP"** checkbox  
- [ ] **"Generate Compressed JPG"** checkbox
- [ ] **"Generate Compressed WebP"** checkbox

## 📋 Dropdown/Select Elements to Test

### File Action Options
- [ ] **"Original Files Action"** dropdown
  - [ ] Copy (Safest - keeps originals in place)
  - [ ] Leave (Don't include in package)
- [ ] **"RAW Files Action"** dropdown  
  - [ ] Copy (Safest - keeps RAW files in place)
  - [ ] Leave (Don't include in package)

### Quality & Size Settings
- [ ] **"Compressed Max Size"** dropdown
  - [ ] 1920px (HD)
  - [ ] 2048px (2K) 
  - [ ] 2560px (QHD)

### Metadata Options  
- [ ] **"EXIF Data Handling"** dropdown
  - [ ] Preserve All
  - [ ] Strip All
  - [ ] Remove Date Only
  - [ ] Remove Camera Only
  - [ ] Remove Date & Camera

## 🎚️ Range Sliders to Test

### Quality Controls
- [ ] **"Optimized Quality"** slider (60-95)
  - [ ] Value display updates correctly
  - [ ] Min value (60) works
  - [ ] Max value (95) works
  - [ ] Mid-range values work
  - [ ] Value saved/restored correctly
- [ ] **"Compressed Quality"** slider (30-80)
  - [ ] Value display updates correctly  
  - [ ] Min value (30) works
  - [ ] Max value (80) works
  - [ ] Mid-range values work
  - [ ] Value saved/restored correctly

## 📝 Text Input Fields to Test

### Project Information
- [ ] **"Project Name"** text input
  - [ ] Accepts valid names
  - [ ] Rejects empty input
  - [ ] Handles special characters
  - [ ] Default value generation works
- [ ] **"Studio Name"** text input
  - [ ] Accepts valid names
  - [ ] Uses default when empty
- [ ] **"Website"** URL input
  - [ ] Accepts valid URLs
  - [ ] URL validation works
  - [ ] Uses default when empty  
- [ ] **"Email"** email input
  - [ ] Accepts valid emails
  - [ ] Email validation works
  - [ ] Uses default when empty

## 🖱️ Drag & Drop Interactions to Test

### Drop Zone Events
- [ ] **Drag Over** - visual feedback (drag-over class)
- [ ] **Drag Leave** - removes visual feedback
- [ ] **File Drop** - processes dropped files
- [ ] **Folder Drop** - processes entire folder structures
- [ ] **Invalid Drop** - handles non-image files gracefully

## 🎯 Critical Button Combination Tests

### Checkbox Logic Combinations (64 total combinations)
- [ ] **All checkboxes unchecked** - should show error
- [ ] **Only originals checked** - should work
- [ ] **Only RAW checked** - should work  
- [ ] **Only output formats checked** - should work
- [ ] **All checkboxes checked** - should work
- [ ] **Mixed combinations** - test all 59 remaining combinations

### Dropdown Dependency Tests  
- [ ] **Include Originals OFF + Copy Originals Action** - action ignored
- [ ] **Include Originals OFF + Leave Originals Action** - consistent
- [ ] **Include RAW OFF + Copy RAW Action** - action ignored
- [ ] **Include RAW OFF + Leave RAW Action** - consistent

### Edge Case Combinations
- [ ] **No outputs selected** - should prevent processing
- [ ] **Only leave actions selected** - should prevent processing  
- [ ] **Empty project name + valid settings** - should prevent processing
- [ ] **Invalid email + valid settings** - should show browser validation
- [ ] **Invalid URL + valid settings** - should show browser validation

## 🔄 UI State Transition Tests

### Panel Visibility  
- [ ] **dropZone → configPanel** (after file selection)
- [ ] **configPanel → progressPanel** (after start processing)
- [ ] **progressPanel → completionPanel** (after processing complete)  
- [ ] **completionPanel → dropZone** (after start over)
- [ ] **error state → configPanel** (after retry)
- [ ] **error state → dropZone** (after start over)

### Button State Changes
- [ ] **Start Processing** button disabled during processing
- [ ] **Download Package** button enabled after completion
- [ ] **Process Another Folder** button always enabled
- [ ] **Select Folder** button always enabled

## ⚠️ Error Scenario Tests

### Processing Errors
- [ ] **No files selected** - should show error message
- [ ] **Unsupported file types only** - should handle gracefully
- [ ] **Memory limit exceeded** - should handle gracefully
- [ ] **Network error** (if applicable) - should show retry option
- [ ] **Processing interrupted** - should show retry option

### Input Validation Errors  
- [ ] **Empty required fields** - should show validation message
- [ ] **Invalid URL format** - should show browser validation
- [ ] **Invalid email format** - should show browser validation
- [ ] **Out of range slider values** - should constrain to valid range

## 💾 Settings Persistence Tests

### LocalStorage Save/Load
- [ ] **Settings saved on processing start**
- [ ] **Settings restored on page reload**
- [ ] **Default values used for new users**
- [ ] **Corrupted localStorage handled gracefully**
- [ ] **Missing localStorage keys handled gracefully**

## 📱 Responsive Design Tests

### Mobile/Tablet Interactions
- [ ] **Touch events work correctly**
- [ ] **Buttons are touch-friendly sized**  
- [ ] **Dropdowns work on mobile**
- [ ] **Range sliders work on touch**
- [ ] **File selection works on mobile**

## 🏃 Performance Tests

### Large Batch Handling
- [ ] **100+ files selected** - UI remains responsive  
- [ ] **1GB+ folder selected** - memory usage acceptable
- [ ] **10GB+ folder selected** - streaming works correctly
- [ ] **Progress updates** - don't block UI thread
- [ ] **Background processing** - UI remains interactive

## ✅ Final Integration Tests

### Complete User Workflows
- [ ] **Happy path**: Select folder → Configure → Process → Download
- [ ] **Retry path**: Select folder → Configure → Process fails → Retry → Success  
- [ ] **Change mind path**: Select folder → Configure → Start over → New folder
- [ ] **Settings persistence**: Configure → Process → Reload page → Settings restored

---

## 🧪 Automated Test Commands

```javascript
// Run in browser console for automated testing
const validator = new UIValidator();
await validator.runFullValidation();
```

## 📊 Expected Results

- **Total Interactive Elements**: 47 elements
- **Total Combinations to Test**: 500+ scenarios  
- **Expected Pass Rate**: 100%
- **Critical Failures**: 0 allowed

---

**Status: Ready for systematic testing**  
**Priority: All combinations must work flawlessly before production deployment**