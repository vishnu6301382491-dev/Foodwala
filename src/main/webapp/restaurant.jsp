<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="java.util.List" %>
<%@ page import="com.tap.model.Restaurant" %>
<%@ page import="com.tap.model.Cart" %>
<%@ page import="com.tap.model.User" %>
<%@ page import="com.tap.model.CurrentLocation" %>
<%
    List<Restaurant> restaurants = (List<Restaurant>) request.getAttribute("restaurants");
    Integer totalCount = (Integer) request.getAttribute("totalCount");
    if (restaurants == null || restaurants.isEmpty()) {
        try {
            restaurants = new com.tap.daoimpl.RestaurantDAOImpl().getAllRestaurants();
        } catch (Exception ignored) {}
    }
    if (totalCount == null) {
        totalCount = (restaurants != null) ? restaurants.size() : 0;
    }
    Cart cart = (Cart) session.getAttribute("cart");
    User loggedInUser = (User) session.getAttribute("loggedInUser");
    int cartCount = (cart != null) ? cart.getItemCount() : 0;

    CurrentLocation loc = (CurrentLocation) session.getAttribute("currentLocation");
    if (loc == null) {
        loc = (CurrentLocation) request.getAttribute("currentLocation");
    }
    if (loc == null) {
        loc = new CurrentLocation(12.9416, 77.5750, 10.0,
                                  "Basavanagudi, Bengaluru, Karnataka 560004",
                                  "Bengaluru", "Karnataka", "560004");
        session.setAttribute("currentLocation", loc);
    }
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Top Restaurants in Bengaluru - FoodWala</title>
    <link rel="stylesheet" href="<%=request.getContextPath()%>/style.css?v=<%=System.currentTimeMillis()%>">
    <style>
        /* ============================================================
           FOODWALA SEARCH & FILTER SECTION (MODERN 3-ROW LAYOUT)
           ============================================================ */
        .search-filter-section {
            background: #ffffff;
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: 16px;
            padding: 24px 28px;
            margin-bottom: 26px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
            box-sizing: border-box;
        }

        /* 1. Search Bar */
        .search-bar-row {
            display: flex;
            justify-content: center;
            margin-bottom: 16px;
            width: 100%;
        }

        .search-input-wrapper {
            position: relative;
            width: 100%;
            max-width: 650px;
            display: flex;
            align-items: center;
        }

        .search-input-wrapper .search-icon {
            position: absolute;
            left: 18px;
            font-size: 17px;
            color: #94a3b8;
            pointer-events: none;
        }

        .search-input-wrapper input {
            width: 100%;
            height: 48px;
            padding: 0 42px 0 48px;
            background: #f8fafc;
            border: 1.5px solid #e2e8f0;
            border-radius: 999px;
            font-size: 15px;
            font-weight: 500;
            color: #1e293b;
            outline: none;
            transition: all 0.2s ease;
            box-sizing: border-box;
        }

        .search-input-wrapper input:focus {
            background: #ffffff;
            border-color: #ff5200;
            box-shadow: 0 0 0 4px rgba(255, 82, 0, 0.12);
        }

        .search-input-wrapper input::placeholder {
            color: #94a3b8;
            font-weight: 400;
        }

        .search-clear-btn {
            position: absolute;
            right: 14px;
            background: #e2e8f0;
            border: none;
            border-radius: 50%;
            width: 26px;
            height: 26px;
            font-size: 13px;
            font-weight: 700;
            color: #64748b;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            z-index: 2;
            padding: 0;
            line-height: 1;
        }

        .search-clear-btn:hover {
            background: #ff5200;
            color: #ffffff;
        }

        /* Search Suggestions Dropdown */
        .search-suggestions-dropdown {
            position: absolute;
            top: calc(100% + 8px);
            left: 0;
            right: 0;
            background: #ffffff;
            border: 1.5px solid #fed7aa;
            border-radius: 16px;
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
            z-index: 1000;
            max-height: 380px;
            overflow-y: auto;
            padding: 8px 0;
            text-align: left;
        }

        .suggestion-section-title {
            font-size: 11px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            padding: 8px 18px 4px;
            letter-spacing: 0.5px;
        }

        .suggestion-item {
            padding: 10px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            transition: all 0.15s ease;
            font-size: 14px;
            color: #1e293b;
            text-decoration: none;
        }

        .suggestion-item:hover, .suggestion-item.selected {
            background: #fff7ed;
            color: #ff5200;
        }

        .suggestion-left {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
        }

        .suggestion-type {
            font-size: 11px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            padding: 2px 8px;
            background: #f1f5f9;
            border-radius: 6px;
        }

        .did-you-mean-banner {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 12px;
            padding: 10px 16px;
            margin-bottom: 18px;
            font-size: 14px;
            color: #1e40af;
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            box-sizing: border-box;
        }

        .did-you-mean-link {
            color: #ff5200;
            font-weight: 700;
            text-decoration: underline;
            cursor: pointer;
        }

        .matched-dishes-box {
            background: #fff7ed;
            border: 1px dashed #fed7aa;
            border-radius: 10px;
            padding: 8px 10px;
            margin-bottom: 12px;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .matched-dishes-label {
            font-size: 11px;
            font-weight: 700;
            color: #c2410c;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .matched-dish-pill {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            font-weight: 600;
            color: #1e293b;
            background: #ffffff;
            padding: 4px 8px;
            border-radius: 6px;
            border: 1px solid #ffedd5;
        }

        .matched-dish-pill .dish-price {
            color: #ea580c;
            font-weight: 700;
        }

        .popular-search-chip {
            display: inline-block;
            background: #f1f5f9;
            color: #475569;
            border: 1.5px solid #e2e8f0;
            border-radius: 999px;
            padding: 6px 14px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            margin: 4px;
            transition: all 0.2s;
        }

        .popular-search-chip:hover {
            background: #ff5200;
            color: #ffffff;
            border-color: #ff5200;
            transform: translateY(-1px);
        }

        /* 2. Dropdown Filters */
        .dropdown-filters-row {
            display: flex;
            gap: 12px;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            margin-bottom: 18px;
            width: 100%;
        }

        .select-wrapper {
            flex: 1;
            min-width: 200px;
            max-width: 280px;
        }

        .filter-select {
            width: 100%;
            height: 44px;
            padding: 0 16px;
            background: #ffffff;
            border: 1.5px solid #e2e8f0;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            color: #334155;
            cursor: pointer;
            outline: none;
            transition: all 0.2s ease;
            box-sizing: border-box;
        }

        .filter-select:hover {
            border-color: #cbd5e1;
        }

        .filter-select:focus {
            border-color: #ff5200;
            box-shadow: 0 0 0 3px rgba(255, 82, 0, 0.12);
        }

        /* 3. Quick Filter Chips */
        .quick-filters-row {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: center;
            padding-top: 16px;
            border-top: 1px solid #f1f5f9;
            width: 100%;
        }

        .quick-filters-label {
            font-size: 13px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-right: 4px;
        }

        .filter-chip {
            background: #f8fafc;
            border: 1.5px solid #e2e8f0;
            color: #334155;
            padding: 8px 16px;
            border-radius: 999px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            user-select: none;
            box-sizing: border-box;
        }

        .filter-chip:hover {
            border-color: #ff5200;
            color: #ff5200;
            background: #fff7ed;
            box-shadow: 0 2px 6px rgba(255, 82, 0, 0.1);
        }

        .filter-chip.active {
            background: #ff5200;
            border-color: #ff5200;
            color: #ffffff;
            box-shadow: 0 2px 8px rgba(255, 82, 0, 0.25);
        }

        .filter-chip.clear-chip {
            background: #fee2e2;
            border-color: #fca5a5;
            color: #dc2626;
        }

        .filter-chip.clear-chip:hover {
            background: #fecaca;
            color: #b91c1c;
        }

        /* 4. Restaurants Header Row */
        .restaurants-header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 14px;
            margin-bottom: 24px;
            width: 100%;
        }

        .result-count-badge {
            display: inline-block;
            font-size: 14px;
            font-weight: 700;
            color: #64748b;
            background: #ffffff;
            padding: 8px 18px;
            border-radius: 999px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        @media (max-width: 900px) {
            .select-wrapper {
                min-width: calc(50% - 8px);
                max-width: 100%;
            }
        }

        @media (max-width: 640px) {
            .search-filter-section {
                padding: 18px 16px;
            }
            .select-wrapper {
                min-width: 100%;
                max-width: 100%;
            }
            .quick-filters-row {
                justify-content: flex-start;
            }
            .quick-filters-label {
                width: 100%;
                margin-bottom: 4px;
            }
            .restaurants-header-row {
                flex-direction: column;
                align-items: flex-start;
            }
        }
    </style>
</head>
<body>

    <!-- NAVBAR -->
    <header class="navbar">
        <div class="nav-container">
            <a href="<%=request.getContextPath()%>/home" class="brand-logo">
                <span class="logo-icon">🍲</span>
                FoodWala
            </a>
            <nav class="nav-links">
                <a href="<%=request.getContextPath()%>/restaurants" class="nav-link" style="color: var(--primary);">Restaurants</a>
                <a href="<%=request.getContextPath()%>/cart" class="nav-link">
                    🛒 Cart <% if(cartCount > 0) { %><span class="nav-badge"><%=cartCount%></span><% } %>
                </a>
                <% if(loggedInUser != null) { %>
                    <span class="user-pill">👤 <%=loggedInUser.getUsername()%></span>
                    <a href="<%=request.getContextPath()%>/profile" class="nav-link">My Profile</a>
                    <a href="<%=request.getContextPath()%>/orders" class="nav-link">My Orders</a>
                    <% if(loggedInUser.isRestaurant() || loggedInUser.isAdmin()) { %>
                        <a href="<%=request.getContextPath()%>/restaurant/dashboard" class="nav-link" style="color:#d97706; font-weight:700;">🍽️ Rest. Portal</a>
                    <% } %>
                    <% if(loggedInUser.isDeliveryPartner() || loggedInUser.isAdmin()) { %>
                        <a href="<%=request.getContextPath()%>/delivery/dashboard" class="nav-link" style="color:#2563eb; font-weight:700;">🛵 Delivery Portal</a>
                    <% } %>
                    <a href="<%=request.getContextPath()%>/logout" class="nav-link">Logout</a>
                <% } else { %>
                    <a href="<%=request.getContextPath()%>/login" class="nav-link">Login</a>
                    <a href="<%=request.getContextPath()%>/register" class="btn btn-sm">Register</a>
                <% } %>
            </nav>
        </div>
    </header>

    <!-- LOCATION BAR -->
    <div class="location-bar">
        <div class="location-bar-content">
            <div class="loc-text">
                <span>📍 Delivering to:</span>
                <span class="loc-pill" id="currentAddressDisplay"><%=loc.getFormattedAddress()%></span>
            </div>
            <div>
                <button type="button" class="btn btn-secondary btn-sm" onclick="openLocationModal()">
                    Change Location 🔄
                </button>
            </div>
        </div>
    </div>

    <div class="page-wrap">
        <!-- SEARCH AND FILTER SECTION -->
        <div class="search-filter-section">
            <!-- 1. Centered Prominent Search Bar -->
            <div class="search-bar-row">
                <div class="search-input-wrapper">
                    <span class="search-icon">🔍</span>
                    <input type="text" id="searchInput" placeholder="Search restaurants, cuisines, or dishes (e.g. biryani, dosa, pizza)..." autocomplete="off">
                    <button type="button" id="clearSearchBtn" class="search-clear-btn" style="display: none;" onclick="clearSearchInput()" title="Clear search">✕</button>
                    <div id="searchSuggestions" class="search-suggestions-dropdown" style="display: none;"></div>
                </div>
            </div>

            <!-- 2. Horizontal Dropdowns Row -->
            <div class="dropdown-filters-row">
                <div class="select-wrapper">
                    <select id="areaFilter" class="filter-select" title="Filter by Bengaluru Area">
                        <option value="">All Bengaluru Areas</option>
                        <option value="Basavanagudi">Basavanagudi</option>
                        <option value="Indiranagar">Indiranagar</option>
                        <option value="Koramangala">Koramangala</option>
                        <option value="Whitefield">Whitefield</option>
                        <option value="HSR Layout">HSR Layout</option>
                        <option value="Malleshwaram">Malleshwaram</option>
                        <option value="Jayanagar">Jayanagar</option>
                        <option value="JP Nagar">JP Nagar</option>
                        <option value="BTM Layout">BTM Layout</option>
                        <option value="Bellandur">Bellandur</option>
                        <option value="Electronic City">Electronic City</option>
                        <option value="Marathahalli">Marathahalli</option>
                        <option value="Sarjapur Road">Sarjapur Road</option>
                        <option value="Hebbal">Hebbal</option>
                        <option value="MG Road / Central">MG Road / Central</option>
                        <option value="Rajajinagar">Rajajinagar</option>
                        <option value="Banashankari">Banashankari</option>
                    </select>
                </div>

                <div class="select-wrapper">
                    <select id="cuisineFilter" class="filter-select" title="Filter by Cuisine">
                        <option value="">All Cuisines</option>
                        <option value="South Indian">South Indian</option>
                        <option value="North Indian">North Indian</option>
                        <option value="Biryani">Biryani</option>
                        <option value="Chinese">Chinese / Asian</option>
                        <option value="Italian">Italian / Pizza</option>
                        <option value="Burgers">Burgers & Fast Food</option>
                        <option value="Cafe">Cafe & Desserts</option>
                        <option value="Street Food">Street Food & Chaat</option>
                        <option value="Mughlai">Mughlai & Kebabs</option>
                        <option value="Healthy">Healthy & Salads</option>
                    </select>
                </div>

                <div class="select-wrapper">
                    <select id="sortSelect" class="filter-select" title="Sort Restaurants">
                        <option value="distance">📍 Distance: Nearest First</option>
                        <option value="rating">⭐ Rating: High to Low</option>
                        <option value="deliveryTime">⚡ Delivery Time: Fastest First</option>
                        <option value="popularity">🔥 Most Popular</option>
                        <option value="name">🔤 Name: A to Z</option>
                    </select>
                </div>
            </div>

            <!-- 3. Horizontal Quick Filter Chips -->
            <div class="quick-filters-row">
                <span class="quick-filters-label">Quick Filters:</span>
                <div class="filter-chip" data-filter="veg" onclick="toggleChip(this)">
                    🟢 Pure Veg
                </div>
                <div class="filter-chip" data-filter="rating4" onclick="toggleChip(this)">
                    ⭐ 4.0+ Rated
                </div>
                <div class="filter-chip" data-filter="fast" onclick="toggleChip(this)">
                    ⚡ Under 30 Mins
                </div>
                <div class="filter-chip" data-filter="open" onclick="toggleChip(this)">
                    🕒 Open Now
                </div>
                <div class="filter-chip" data-filter="dist5" onclick="toggleChip(this)">
                    📍 Within 5 km
                </div>
                <div class="filter-chip" data-filter="dist10" onclick="toggleChip(this)">
                    🛵 Within 10 km
                </div>
                <div class="filter-chip clear-chip" id="clearFiltersBtn" style="display: none;" onclick="resetAllFilters()">
                    ✕ Reset Filters
                </div>
            </div>
        </div>

        <!-- DID YOU MEAN SUGGESTION BANNER -->
        <div id="didYouMeanContainer" style="display: none; width: 100%;"></div>

        <!-- 4. RESTAURANTS HEADER & RESULT COUNT -->
        <div class="restaurants-header-row">
            <div>
                <h1 class="page-title" style="margin-bottom: 4px;">Restaurants in Bengaluru</h1>
                <p class="page-subtitle" id="locationSubtext">Delivering delicious food to <%=loc.getFormattedAddress()%></p>
            </div>
            <div>
                <span id="resultCountBadge" class="result-count-badge">
                    Showing <%= (restaurants != null ? restaurants.size() : 0) %> of <%= totalCount %> Iconic Eateries
                </span>
            </div>
        </div>

        <!-- RESTAURANTS GRID CONTAINER -->
        <div id="restaurantsGrid" class="restaurant-grid">
            <% if (restaurants != null && !restaurants.isEmpty()) { 
                for (Restaurant r : restaurants) { 
                    String img = r.getImagePath();
                    if (img == null || img.trim().isEmpty()) {
                        img = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4";
                    }
                    double dist = com.tap.util.LocationUtil.calculateDistanceKm(loc.getLatitude(), loc.getLongitude(), r.getLatitude(), r.getLongitude());
                    String openBadge = r.isOpen() ? "<span class=\"badge-open\">🟢 Open</span>" : "<span class=\"badge-closed\">🔴 Closed</span>";
                    String popularTag = r.isPopular() ? "<span class=\"badge-popular\">🔥 Must Visit</span>" : "";
                    String reviewText = (r.getReviewCount() > 0) ? "(" + String.format("%,d", r.getReviewCount()) + "+)" : "";
            %>
                <div class="restaurant-card">
                    <div class="restaurant-img-wrap">
                        <img src="<%=img%>" alt="<%=r.getName()%>" class="restaurant-img" onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4';">
                        <%=openBadge%>
                        <span class="restaurant-rating">⭐ <%=String.format(java.util.Locale.US, "%.1f", r.getRating())%></span>
                        <span class="restaurant-badge-time">📍 <%=String.format(java.util.Locale.US, "%.1f", dist)%> km • ⚡ <%=r.getDeliveryTime()%> mins</span>
                    </div>
                    <div class="restaurant-info">
                        <%=popularTag%>
                        <h2 class="restaurant-name"><%=r.getName()%></h2>
                        <p class="restaurant-cuisine"><%=r.getCuisineType()%></p>
                        <p class="restaurant-address">📍 <%= (r.getArea() != null && !r.getArea().isBlank()) ? r.getArea() : r.getAddress() %></p>
                        <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; color:var(--text-muted); margin-bottom:14px;">
                            <span>🛵 ₹<%=Math.round(r.getDeliveryFee())%> delivery</span>
                            <span>⭐ <%=String.format(java.util.Locale.US, "%.1f", r.getRating())%> <%=reviewText%></span>
                        </div>
                        <div>
                            <a href="<%=request.getContextPath()%>/menu?restaurantId=<%=r.getRestaurantId()%>" class="btn btn-block">
                                Explore Menu →
                            </a>
                        </div>
                    </div>
                </div>
            <% 
                } 
            } 
            %>
        </div>

        <!-- EMPTY STATE -->
        <div id="emptyState" class="empty-state" style="display: none;">
            <div class="empty-icon">🍽️</div>
            <h2 class="empty-title">No Restaurants Found</h2>
            <p class="empty-subtitle" id="emptySubtitle">We couldn't find any restaurants matching your current search and filter criteria.</p>
            <div id="emptyDidYouMean" style="margin: 12px 0; font-size: 15px;"></div>
            <div style="margin-top: 18px;">
                <p style="font-size: 13px; font-weight: 700; color: #64748b; margin-bottom: 10px;">POPULAR SEARCHES IN BENGALURU:</p>
                <div>
                    <span class="popular-search-chip" onclick="applyQuickSearch('Biryani')">🍗 Biryani</span>
                    <span class="popular-search-chip" onclick="applyQuickSearch('Masala Dosa')">🥞 Masala Dosa</span>
                    <span class="popular-search-chip" onclick="applyQuickSearch('Pizza')">🍕 Pizza</span>
                    <span class="popular-search-chip" onclick="applyQuickSearch('Burger')">🍔 Burger</span>
                    <span class="popular-search-chip" onclick="applyQuickSearch('Paneer Butter Masala')">🧀 Paneer Butter Masala</span>
                    <span class="popular-search-chip" onclick="applyQuickSearch('Shawarma')">🌯 Shawarma</span>
                    <span class="popular-search-chip" onclick="applyQuickSearch('Filter Coffee')">☕ Filter Coffee</span>
                    <span class="popular-search-chip" onclick="applyQuickSearch('Ice Cream')">🍨 Ice Cream</span>
                </div>
            </div>
            <button type="button" class="btn" onclick="resetAllFilters()" style="margin-top: 22px;">
                Reset All Filters
            </button>
        </div>

        <!-- PAGINATION / LOAD MORE -->
        <div class="pagination-wrap" id="paginationWrap" style="display: <%= (totalCount > (restaurants != null ? restaurants.size() : 0)) ? "block" : "none" %>;">
            <button type="button" class="load-more-btn" id="loadMoreBtn" onclick="loadMoreRestaurants()">
                Load More Restaurants ⬇
            </button>
        </div>
    </div>

    <!-- LOCATION MODAL -->
    <div id="locationModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000; align-items: center; justify-content: center;">
        <div style="background: white; border-radius: 16px; padding: 28px; width: 90%; max-width: 480px; box-shadow: 0 10px 30px rgba(0,0,0,0.25);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="font-size: 20px; font-weight: 800; color: var(--dark);">📍 Select Delivery Location</h3>
                <button type="button" onclick="closeLocationModal()" style="border: none; background: transparent; font-size: 20px; cursor: pointer;">✕</button>
            </div>

            <!-- GPS DETECTION BUTTON -->
            <button type="button" class="btn btn-block" id="gpsBtn" onclick="detectGpsLocation()" style="margin-bottom: 16px;">
                📍 Use Current GPS Location
            </button>
            <div id="gpsStatus" style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px; text-align: center;"></div>

            <div style="text-align: center; color: var(--text-muted); font-size: 12px; margin: 12px 0; position: relative;">
                <span style="background: white; padding: 0 10px; position: relative; z-index: 1;">OR SELECT BENGALURU LOCALITY</span>
                <div style="position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: var(--border-color); z-index: 0;"></div>
            </div>

            <!-- PRESET LOCALITY PICKER -->
            <form action="<%=request.getContextPath()%>/location/confirm" method="post" id="locConfirmForm">
                <input type="hidden" name="latitude" id="locLat" value="<%=loc.getLatitude()%>">
                <input type="hidden" name="longitude" id="locLng" value="<%=loc.getLongitude()%>">
                <input type="hidden" name="formattedAddress" id="locFormattedAddress" value="<%=loc.getFormattedAddress()%>">
                <input type="hidden" name="city" id="locCity" value="<%=loc.getCity()%>">
                <input type="hidden" name="state" id="locState" value="<%=loc.getState()%>">
                <input type="hidden" name="pincode" id="locPincode" value="<%=loc.getPincode()%>">
                <input type="hidden" name="redirect" value="/restaurants">

                <div class="form-group">
                    <label class="form-label">Popular Localities</label>
                    <select class="form-control" onchange="onPresetChange(this.value)">
                        <option value="12.9416,77.5750,Basavanagudi, Bengaluru, Karnataka 560004,Basavanagudi,560004">Basavanagudi (560004)</option>
                        <option value="12.9784,77.6408,Indiranagar 100ft Road, Bengaluru, Karnataka 560038,Indiranagar,560038">Indiranagar (560038)</option>
                        <option value="12.9343,77.6186,Koramangala 5th Block, Bengaluru, Karnataka 560034,Koramangala,560034">Koramangala (560034)</option>
                        <option value="12.9698,77.7499,ITPL Main Road, Whitefield, Bengaluru, Karnataka 560066,Whitefield,560066">Whitefield (560066)</option>
                        <option value="12.9116,77.6389,Sector 1 HSR Layout, Bengaluru, Karnataka 560102,HSR Layout,560102">HSR Layout (560102)</option>
                        <option value="13.0031,77.5714,Malleshwaram 8th Cross, Bengaluru, Karnataka 560003,Malleshwaram,560003">Malleshwaram (560003)</option>
                        <option value="12.9298,77.5834,4th Block Jayanagar, Bengaluru, Karnataka 560011,Jayanagar,560011">Jayanagar (560011)</option>
                        <option value="12.9063,77.5857,JP Nagar 2nd Phase, Bengaluru, Karnataka 560078,JP Nagar,560078">JP Nagar (560078)</option>
                        <option value="12.9166,77.6101,BTM Layout 2nd Stage, Bengaluru, Karnataka 560076,BTM Layout,560076">BTM Layout (560076)</option>
                        <option value="12.9304,77.6784,Bellandur Outer Ring Road, Bengaluru, Karnataka 560103,Bellandur,560103">Bellandur (560103)</option>
                        <option value="12.8452,77.6602,Electronic City Phase 1, Bengaluru, Karnataka 560100,Electronic City,560100">Electronic City (560100)</option>
                        <option value="12.9569,77.7011,Marathahalli Bridge, Bengaluru, Karnataka 560037,Marathahalli,560037">Marathahalli (560037)</option>
                        <option value="12.9102,77.6850,Sarjapur Main Road, Bengaluru, Karnataka 560035,Sarjapur Road,560035">Sarjapur Road (560035)</option>
                        <option value="13.0358,77.5970,Hebbal Kempapura, Bengaluru, Karnataka 560024,Hebbal,560024">Hebbal (560024)</option>
                        <option value="12.9756,77.6066,MG Road / Church Street, Bengaluru, Karnataka 560001,MG Road,560001">MG Road / Central (560001)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Delivery Address Preview</label>
                    <input type="text" id="locPreview" class="form-control" value="<%=loc.getFormattedAddress()%>" readonly>
                </div>

                <button type="submit" class="btn btn-block" style="margin-top: 10px;">
                    Use This Location →
                </button>
            </form>
        </div>
    </div>

    <!-- FOOTER -->
    <footer class="footer">
        <p>© 2026 FoodWala Food Delivery. Made with ❤️ for food lovers.</p>
    </footer>

    <!-- CLIENT SCRIPT FOR DYNAMIC SEARCH, FILTERS & PAGINATION -->
    <script>
        var contextPath = '<%=request.getContextPath()%>';
        var userLat = <%=loc.getLatitude()%>;
        var userLng = <%=loc.getLongitude()%>;
        var currentPage = 1;
        var pageSize = 12;
        var totalItems = <%= totalCount %>;
        var activeFilters = {
            search: '',
            cuisine: '',
            area: '',
            sort: 'distance',
            veg: false,
            rating4: false,
            fast: false,
            open: false,
            dist5: false,
            dist10: false
        };

        var searchDebounceTimer = null;
        var suggestionDebounceTimer = null;
        var selectedSuggestionIndex = -1;

        // Initialize on DOM load
        document.addEventListener('DOMContentLoaded', function() {
            var searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('input', function(e) {
                    onSearchInputChange(e.target.value);
                });
                searchInput.addEventListener('keydown', function(e) {
                    handleSearchKeydown(e);
                });
                searchInput.addEventListener('focus', function(e) {
                    if (e.target.value.trim().length >= 2) {
                        fetchSuggestions(e.target.value.trim());
                    }
                });
            }

            // Close suggestions dropdown when clicking outside
            document.addEventListener('click', function(e) {
                var searchWrapper = document.querySelector('.search-input-wrapper');
                var suggestionsDropdown = document.getElementById('searchSuggestions');
                if (searchWrapper && suggestionsDropdown && !searchWrapper.contains(e.target)) {
                    suggestionsDropdown.style.display = 'none';
                    selectedSuggestionIndex = -1;
                }
            });

            var areaFilter = document.getElementById('areaFilter');
            if (areaFilter) {
                areaFilter.addEventListener('change', function(e) {
                    activeFilters.area = e.target.value;
                    currentPage = 1;
                    fetchRestaurants(1, false);
                    checkClearFilterButtonVisibility();
                });
            }

            var cuisineFilter = document.getElementById('cuisineFilter');
            if (cuisineFilter) {
                cuisineFilter.addEventListener('change', function(e) {
                    activeFilters.cuisine = e.target.value;
                    currentPage = 1;
                    fetchRestaurants(1, false);
                    checkClearFilterButtonVisibility();
                });
            }

            var sortSelect = document.getElementById('sortSelect');
            if (sortSelect) {
                sortSelect.addEventListener('change', function(e) {
                    activeFilters.sort = e.target.value;
                    currentPage = 1;
                    fetchRestaurants(1, false);
                    checkClearFilterButtonVisibility();
                });
            }
        });

        function handleSearchKeydown(e) {
            var suggestionsDropdown = document.getElementById('searchSuggestions');
            var items = suggestionsDropdown ? suggestionsDropdown.querySelectorAll('.suggestion-item') : [];

            if (e.key === 'ArrowDown') {
                if (suggestionsDropdown && suggestionsDropdown.style.display !== 'none' && items.length > 0) {
                    e.preventDefault();
                    selectedSuggestionIndex = (selectedSuggestionIndex + 1) % items.length;
                    highlightSuggestion(items);
                }
            } else if (e.key === 'ArrowUp') {
                if (suggestionsDropdown && suggestionsDropdown.style.display !== 'none' && items.length > 0) {
                    e.preventDefault();
                    selectedSuggestionIndex = (selectedSuggestionIndex - 1 + items.length) % items.length;
                    highlightSuggestion(items);
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (suggestionsDropdown && suggestionsDropdown.style.display !== 'none' && selectedSuggestionIndex >= 0 && selectedSuggestionIndex < items.length) {
                    items[selectedSuggestionIndex].click();
                } else {
                    hideSuggestions();
                    clearTimeout(searchDebounceTimer);
                    activeFilters.search = e.target.value.trim();
                    currentPage = 1;
                    fetchRestaurants(1, false);
                    checkClearFilterButtonVisibility();
                }
            } else if (e.key === 'Escape') {
                hideSuggestions();
                clearSearchInput();
            }
        }

        function highlightSuggestion(items) {
            for (var i = 0; i < items.length; i++) {
                if (i === selectedSuggestionIndex) {
                    items[i].classList.add('selected');
                    items[i].scrollIntoView({ block: 'nearest' });
                } else {
                    items[i].classList.remove('selected');
                }
            }
        }

        function hideSuggestions() {
            var suggestionsDropdown = document.getElementById('searchSuggestions');
            if (suggestionsDropdown) {
                suggestionsDropdown.style.display = 'none';
            }
            selectedSuggestionIndex = -1;
        }

        function onSearchInputChange(val) {
            var clearBtn = document.getElementById('clearSearchBtn');
            if (clearBtn) {
                clearBtn.style.display = (val && val.length > 0) ? 'inline-flex' : 'none';
            }

            // Autocomplete suggestions
            clearTimeout(suggestionDebounceTimer);
            if (val && val.trim().length >= 2) {
                suggestionDebounceTimer = setTimeout(function() {
                    fetchSuggestions(val.trim());
                }, 120);
            } else {
                hideSuggestions();
            }

            // Restaurant grid search
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(function() {
                activeFilters.search = val.trim();
                currentPage = 1;
                fetchRestaurants(1, false);
                checkClearFilterButtonVisibility();
            }, 200);
        }

        function fetchSuggestions(query) {
            fetch(contextPath + '/api/search/suggestions?q=' + encodeURIComponent(query))
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    renderSuggestionsDropdown(data);
                })
                .catch(function(err) {
                    console.error('Error fetching suggestions:', err);
                });
        }

        function renderSuggestionsDropdown(data) {
            var dropdown = document.getElementById('searchSuggestions');
            if (!dropdown) return;

            var html = '';
            var count = 0;

            if (data.didYouMean) {
                html += '<div class="suggestion-item" style="background:#eff6ff; color:#1e40af;" onclick="applyQuickSearch(\'' + escapeHtmlForJs(data.didYouMean) + '\')">' +
                    '<div class="suggestion-left"><span>💡</span><span>Did you mean <strong>' + escapeHtml(data.didYouMean) + '</strong>?</span></div>' +
                    '<span class="suggestion-type" style="background:#dbeafe; color:#1e40af;">Suggestion</span>' +
                '</div>';
                count++;
            }

            if (data.dishes && data.dishes.length > 0) {
                html += '<div class="suggestion-section-title">Dishes & Cuisines</div>';
                for (var i = 0; i < data.dishes.length; i++) {
                    var d = data.dishes[i];
                    html += '<div class="suggestion-item" onclick="applyQuickSearch(\'' + escapeHtmlForJs(d.name) + '\')">' +
                        '<div class="suggestion-left"><span>' + (d.icon || '🍲') + '</span><span>' + escapeHtml(d.name) + '</span></div>' +
                        '<span class="suggestion-type">' + escapeHtml(d.type || 'Dish') + '</span>' +
                    '</div>';
                    count++;
                }
            }

            if (data.restaurants && data.restaurants.length > 0) {
                html += '<div class="suggestion-section-title">Restaurants</div>';
                for (var j = 0; j < data.restaurants.length; j++) {
                    var r = data.restaurants[j];
                    html += '<div class="suggestion-item" onclick="applyQuickSearch(\'' + escapeHtmlForJs(r.name) + '\')">' +
                        '<div class="suggestion-left"><span>' + (r.icon || '🍽️') + '</span><span>' + escapeHtml(r.name) + '</span></div>' +
                        '<span class="suggestion-type">Restaurant</span>' +
                    '</div>';
                    count++;
                }
            }

            if (data.popular && data.popular.length > 0 && count < 3) {
                html += '<div class="suggestion-section-title">Popular Foods</div>';
                for (var k = 0; k < data.popular.length; k++) {
                    var p = data.popular[k];
                    html += '<div class="suggestion-item" onclick="applyQuickSearch(\'' + escapeHtmlForJs(p) + '\')">' +
                        '<div class="suggestion-left"><span>🔥</span><span>' + escapeHtml(p) + '</span></div>' +
                        '<span class="suggestion-type">Popular</span>' +
                    '</div>';
                    count++;
                }
            }

            if (count > 0) {
                dropdown.innerHTML = html;
                dropdown.style.display = 'block';
                selectedSuggestionIndex = -1;
            } else {
                dropdown.style.display = 'none';
            }
        }

        function applyQuickSearch(term) {
            var searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = term;
            }
            var clearBtn = document.getElementById('clearSearchBtn');
            if (clearBtn) {
                clearBtn.style.display = 'inline-flex';
            }
            hideSuggestions();
            activeFilters.search = term;
            currentPage = 1;
            fetchRestaurants(1, false);
            checkClearFilterButtonVisibility();
        }

        function clearSearchInput() {
            var input = document.getElementById('searchInput');
            if (input) {
                input.value = '';
                input.focus();
            }
            var clearBtn = document.getElementById('clearSearchBtn');
            if (clearBtn) clearBtn.style.display = 'none';
            hideSuggestions();
            
            var didYouMeanBox = document.getElementById('didYouMeanContainer');
            if (didYouMeanBox) didYouMeanBox.style.display = 'none';

            activeFilters.search = '';
            currentPage = 1;
            fetchRestaurants(1, false);
            checkClearFilterButtonVisibility();
        }

        function toggleChip(element) {
            var filterName = element.getAttribute('data-filter');
            activeFilters[filterName] = !activeFilters[filterName];
            element.classList.toggle('active', activeFilters[filterName]);
            
            // Handle exclusive distance chips
            if (filterName === 'dist5' && activeFilters.dist5) {
                activeFilters.dist10 = false;
                var d10 = document.querySelector('[data-filter="dist10"]');
                if (d10) d10.classList.remove('active');
            } else if (filterName === 'dist10' && activeFilters.dist10) {
                activeFilters.dist5 = false;
                var d5 = document.querySelector('[data-filter="dist5"]');
                if (d5) d5.classList.remove('active');
            }

            checkClearFilterButtonVisibility();
            currentPage = 1;
            fetchRestaurants(1, false);
        }

        function checkClearFilterButtonVisibility() {
            var hasActive = activeFilters.search || activeFilters.cuisine || activeFilters.area ||
                            activeFilters.veg || activeFilters.rating4 || activeFilters.fast ||
                            activeFilters.open || activeFilters.dist5 || activeFilters.dist10 ||
                            activeFilters.sort !== 'distance';
            
            var clearBtn = document.getElementById('clearFiltersBtn');
            if (clearBtn) {
                clearBtn.style.display = hasActive ? 'inline-flex' : 'none';
            }
        }

        function resetAllFilters() {
            activeFilters = {
                search: '',
                cuisine: '',
                area: '',
                sort: 'distance',
                veg: false,
                rating4: false,
                fast: false,
                open: false,
                dist5: false,
                dist10: false
            };

            var searchInp = document.getElementById('searchInput');
            if (searchInp) searchInp.value = '';
            var clearSearchBtn = document.getElementById('clearSearchBtn');
            if (clearSearchBtn) clearSearchBtn.style.display = 'none';
            hideSuggestions();

            var didYouMeanBox = document.getElementById('didYouMeanContainer');
            if (didYouMeanBox) didYouMeanBox.style.display = 'none';

            var areaInp = document.getElementById('areaFilter');
            if (areaInp) areaInp.value = '';
            var cuisInp = document.getElementById('cuisineFilter');
            if (cuisInp) cuisInp.value = '';
            var sortInp = document.getElementById('sortSelect');
            if (sortInp) sortInp.value = 'distance';

            document.querySelectorAll('.filter-chip').forEach(function(chip) {
                if (!chip.classList.contains('clear-chip')) {
                    chip.classList.remove('active');
                }
            });

            checkClearFilterButtonVisibility();
            currentPage = 1;
            fetchRestaurants(1, false);
        }

        function fetchRestaurants(page, append) {
            currentPage = page;
            var params = new URLSearchParams();
            params.append('page', page);
            params.append('size', pageSize);
            params.append('latitude', userLat);
            params.append('longitude', userLng);

            if (activeFilters.search) params.append('search', activeFilters.search);
            if (activeFilters.cuisine) params.append('cuisine', activeFilters.cuisine);
            if (activeFilters.area) params.append('area', activeFilters.area);
            if (activeFilters.sort) params.append('sort', activeFilters.sort);
            if (activeFilters.veg) params.append('diet', 'veg');
            if (activeFilters.rating4) params.append('minRating', '4.0');
            if (activeFilters.fast) params.append('maxDeliveryTime', '30');
            if (activeFilters.open) params.append('openOnly', 'true');
            if (activeFilters.dist5) params.append('maxDistance', '5.0');
            if (activeFilters.dist10) params.append('maxDistance', '10.0');

            fetch(contextPath + '/api/restaurants?' + params.toString())
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    if (data && data.success) {
                        totalItems = data.total;
                        renderRestaurants(data.restaurants, append);
                        updatePagination(data.page, data.totalPages, data.hasMore);
                        updateResultCount(data.restaurants ? data.restaurants.length : 0, totalItems);
                        updateDidYouMeanBanner(data);
                    }
                })
                .catch(function(err) {
                    console.error('Error fetching restaurants:', err);
                });
        }

        function updateDidYouMeanBanner(data) {
            var banner = document.getElementById('didYouMeanContainer');
            if (!banner) return;

            // If user searched a term, check if there's an alias or didYouMean
            if (activeFilters.search && activeFilters.search.length >= 3) {
                fetch(contextPath + '/api/search/suggestions?q=' + encodeURIComponent(activeFilters.search))
                    .then(function(res) { return res.json(); })
                    .then(function(sugData) {
                        if (sugData && sugData.didYouMean && sugData.didYouMean.toLowerCase() !== activeFilters.search.toLowerCase()) {
                            banner.innerHTML = '<div class="did-you-mean-banner">' +
                                '<span>💡 Showing results for <strong>' + escapeHtml(activeFilters.search) + '</strong>. Did you mean <span class="did-you-mean-link" onclick="applyQuickSearch(\'' + escapeHtmlForJs(sugData.didYouMean) + '\')">' + escapeHtml(sugData.didYouMean) + '</span>?</span>' +
                            '</div>';
                            banner.style.display = 'block';
                            
                            var emptyDym = document.getElementById('emptyDidYouMean');
                            if (emptyDym) {
                                emptyDym.innerHTML = '<span>Did you mean: <span class="did-you-mean-link" onclick="applyQuickSearch(\'' + escapeHtmlForJs(sugData.didYouMean) + '\')">' + escapeHtml(sugData.didYouMean) + '</span>?</span>';
                            }
                        } else {
                            banner.style.display = 'none';
                            var emptyDym = document.getElementById('emptyDidYouMean');
                            if (emptyDym) emptyDym.innerHTML = '';
                        }
                    })
                    .catch(function() {
                        banner.style.display = 'none';
                    });
            } else {
                banner.style.display = 'none';
                var emptyDym = document.getElementById('emptyDidYouMean');
                if (emptyDym) emptyDym.innerHTML = '';
            }
        }

        function renderRestaurants(list, append) {
            var grid = document.getElementById('restaurantsGrid');
            var emptyState = document.getElementById('emptyState');

            if (!append) {
                grid.innerHTML = '';
            }

            if ((!list || list.length === 0) && (!append || grid.children.length === 0)) {
                emptyState.style.display = 'block';
                grid.style.display = 'none';
                var emptySub = document.getElementById('emptySubtitle');
                if (emptySub) {
                    if (activeFilters.search) {
                        emptySub.innerText = 'No restaurants or dishes found matching "' + activeFilters.search + '". Try another spelling or popular dish below.';
                    } else {
                        emptySub.innerText = 'We couldn\'t find any restaurants matching your current filter criteria.';
                    }
                }
                return;
            }

            emptyState.style.display = 'none';
            grid.style.display = 'grid';

            list.forEach(function(r) {
                var img = r.imagePath;
                if (!img || img.trim() === '') {
                    img = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4';
                }
                var distText = (r.distanceKm != null) ? r.distanceKm.toFixed(1) + ' km' : 'Near you';
                var openBadge = r.isOpen 
                    ? '<span class="badge-open">🟢 Open</span>' 
                    : '<span class="badge-closed">🔴 Closed</span>';
                var popularTag = r.isPopular 
                    ? '<span class="badge-popular">🔥 Must Visit</span>' 
                    : '';
                var reviewText = (r.reviewCount > 0) ? '(' + r.reviewCount.toLocaleString() + '+)' : '';

                // Matched dishes rendering
                var matchedDishesHtml = '';
                if (r.matchedMenuItems && r.matchedMenuItems.length > 0) {
                    matchedDishesHtml = '<div class="matched-dishes-box"><span class="matched-dishes-label">Popular matches:</span>';
                    for (var mi = 0; mi < r.matchedMenuItems.length; mi++) {
                        var item = r.matchedMenuItems[mi];
                        var vegIcon = item.isVeg ? '🟢' : '🍗';
                        matchedDishesHtml += '<div class="matched-dish-pill">' +
                            '<span>' + vegIcon + ' ' + escapeHtml(item.itemName) + '</span>' +
                            '<span class="dish-price">₹' + Math.round(item.price) + '</span>' +
                        '</div>';
                    }
                    matchedDishesHtml += '</div>';
                }

                var cardHtml = 
                    '<div class="restaurant-card">' +
                        '<div class="restaurant-img-wrap">' +
                            '<img src="' + img + '" alt="' + escapeHtml(r.name) + '" class="restaurant-img" onerror="this.src=\'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4\';">' +
                            openBadge +
                            '<span class="restaurant-rating">⭐ ' + r.rating.toFixed(1) + '</span>' +
                            '<span class="restaurant-badge-time">📍 ' + distText + ' • ⚡ ' + r.deliveryTime + ' mins</span>' +
                        '</div>' +
                        '<div class="restaurant-info">' +
                            popularTag +
                            '<h2 class="restaurant-name">' + escapeHtml(r.name) + '</h2>' +
                            '<p class="restaurant-cuisine">' + escapeHtml(r.cuisineType) + '</p>' +
                            '<p class="restaurant-address">📍 ' + escapeHtml(r.area || r.address) + '</p>' +
                            '<div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; color:var(--text-muted); margin-bottom:12px;">' +
                                '<span>🛵 ₹' + Math.round(r.deliveryFee) + ' delivery</span>' +
                                '<span>⭐ ' + r.rating.toFixed(1) + ' ' + reviewText + '</span>' +
                            '</div>' +
                            matchedDishesHtml +
                            '<div>' +
                                '<a href="' + contextPath + '/menu?restaurantId=' + r.restaurantId + '" class="btn btn-block">' +
                                    'Explore Menu →' +
                                '</a>' +
                            '</div>' +
                        '</div>' +
                    '</div>';
                grid.insertAdjacentHTML('beforeend', cardHtml);
            });
        }

        function updatePagination(page, totalPages, hasMore) {
            var wrap = document.getElementById('paginationWrap');
            if (wrap) {
                wrap.style.display = hasMore ? 'block' : 'none';
            }
        }

        function loadMoreRestaurants() {
            var btn = document.getElementById('loadMoreBtn');
            if (!btn) return;
            btn.innerText = 'Loading more... ⏳';
            btn.disabled = true;
            fetchRestaurants(currentPage + 1, true);
            setTimeout(function() {
                btn.innerText = 'Load More Restaurants ⬇';
                btn.disabled = false;
            }, 600);
        }

        function updateResultCount(displayedCount, total) {
            var badge = document.getElementById('resultCountBadge');
            if (!badge) return;
            var currentShowing = document.getElementById('restaurantsGrid').children.length;
            if (activeFilters.search && total === 0) {
                badge.innerText = 'No restaurants found for "' + activeFilters.search + '"';
            } else if (total === 0) {
                badge.innerText = 'No restaurants found';
            } else {
                badge.innerText = 'Showing ' + currentShowing + ' of ' + total + ' Iconic Eateries';
            }
        }

        function escapeHtml(text) {
            if (!text) return '';
            return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        }

        function escapeHtmlForJs(text) {
            if (!text) return '';
            return String(text).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
        }

        // Location Modal & GPS logic
        function openLocationModal() {
            var modal = document.getElementById('locationModal');
            if (modal) modal.style.display = 'flex';
        }
        function closeLocationModal() {
            var modal = document.getElementById('locationModal');
            if (modal) modal.style.display = 'none';
        }

        function onPresetChange(val) {
            if (!val) return;
            var parts = val.split(',');
            var lat = parts[0];
            var lng = parts[1];
            var formatted = parts[2] + ', ' + parts[3] + ', ' + parts[4];
            var city = 'Bengaluru';
            var pincode = parts[parts.length - 1];

            document.getElementById('locLat').value = lat;
            document.getElementById('locLng').value = lng;
            document.getElementById('locFormattedAddress').value = formatted;
            document.getElementById('locCity').value = city;
            document.getElementById('locPincode').value = pincode;
            document.getElementById('locPreview').value = formatted;
        }

        function detectGpsLocation() {
            var status = document.getElementById('gpsStatus');
            var btn = document.getElementById('gpsBtn');

            if (!navigator.geolocation) {
                status.innerHTML = '<span style="color:red;">Geolocation is not supported by your browser.</span>';
                return;
            }

            btn.disabled = true;
            btn.innerText = 'Detecting GPS Location...';
            status.innerHTML = 'Acquiring GPS coordinates...';

            navigator.geolocation.getCurrentPosition(
                function(position) {
                    var lat = position.coords.latitude;
                    var lng = position.coords.longitude;
                    var acc = position.coords.accuracy;

                    status.innerHTML = 'Resolving address for ' + lat.toFixed(4) + ', ' + lng.toFixed(4) + '...';

                    fetch(contextPath + '/location/reverse?lat=' + lat + '&lng=' + lng)
                        .then(function(res) { return res.json(); })
                        .then(function(data) {
                            btn.disabled = false;
                            btn.innerText = '📍 GPS Detected!';
                            document.getElementById('locLat').value = data.latitude;
                            document.getElementById('locLng').value = data.longitude;
                            document.getElementById('locFormattedAddress').value = data.formattedAddress;
                            document.getElementById('locCity').value = data.city || 'Bengaluru';
                            document.getElementById('locState').value = data.state || 'Karnataka';
                            document.getElementById('locPincode').value = data.pincode || '560004';
                            document.getElementById('locPreview').value = data.formattedAddress;
                            status.innerHTML = '<span style="color:green; font-weight:700;">✓ ' + data.formattedAddress + ' (±' + Math.round(acc) + 'm)</span>';
                        })
                        .catch(function(err) {
                            btn.disabled = false;
                            btn.innerText = '📍 Use Current GPS Location';
                            status.innerHTML = '<span style="color:orange;">Location detected. Basavanagudi default applied.</span>';
                        });
                },
                function(error) {
                    btn.disabled = false;
                    btn.innerText = '📍 Use Current GPS Location';
                    if (error.code === error.PERMISSION_DENIED) {
                        status.innerHTML = '<span style="color:red;">Location permission denied. Please select from popular localities.</span>';
                    } else {
                        status.innerHTML = '<span style="color:red;">Unable to detect location. Please select a locality below.</span>';
                    }
                },
                { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
            );
        }
    </script>
</body>
</html>
