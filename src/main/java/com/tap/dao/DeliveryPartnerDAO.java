package com.tap.dao;

import java.util.List;
import com.tap.model.DeliveryPartner;

public interface DeliveryPartnerDAO {
    DeliveryPartner getPartnerByUserId(int userId);
    DeliveryPartner getPartnerById(int partnerId);
    List<DeliveryPartner> getAllAvailablePartners();
    boolean updateLocation(int partnerId, double lat, double lng, double accuracy);
    boolean setAvailability(int partnerId, boolean available);
    int createPartner(DeliveryPartner partner);
    DeliveryPartner getFirstAvailableOrDemoPartner();
}
