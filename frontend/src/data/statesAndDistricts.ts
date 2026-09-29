export interface StateDistrictMap {
  [state: string]: string[];
}

export const STATES_AND_DISTRICTS: StateDistrictMap = {
  "Tamil Nadu": [
    "Salem", "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", 
    "Erode", "Tiruppur", "Vellore", "Thoothukudi", "Dindigul", 
    "Thanjavur", "Kanchipuram", "Cuddalore", "Karur", "Nagapattinam"
  ],
  "Maharashtra": [
    "Mumbai City", "Mumbai Suburban", "Pune", "Thane", "Nagpur", 
    "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Amravati"
  ],
  "Karnataka": [
    "Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Dakshina Kannada", 
    "Belagavi", "Dharwad", "Tumakuru", "Shivamogga", "Udupi", "Ballari"
  ],
  "Gujarat": [
    "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", 
    "Jamnagar", "Gandhinagar", "Junagadh", "Bharuch", "Kutch"
  ],
  "Telangana": [
    "Hyderabad", "Medchal-Malkajgiri", "Rangareddy", "Warangal", 
    "Sangareddy", "Nizamabad", "Karimnagar", "Khammam"
  ],
  "Delhi": [
    "Central Delhi", "East Delhi", "New Delhi", "North Delhi", 
    "North East Delhi", "North West Delhi", "South Delhi", "West Delhi"
  ],
  "Kerala": [
    "Thiruvananthapuram", "Ernakulam", "Kozhikode", "Thrissur", 
    "Kollam", "Palakkad", "Kannur", "Kottayam", "Malappuram"
  ],
  "Uttar Pradesh": [
    "Lucknow", "Kanpur Nagar", "Gautam Buddha Nagar", "Ghaziabad", 
    "Varanasi", "Agra", "Prayagraj", "Meerut", "Bareilly", "Aligarh"
  ],
  "Andhra Pradesh": [
    "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati"
  ],
  "Rajasthan": [
    "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara"
  ]
};
