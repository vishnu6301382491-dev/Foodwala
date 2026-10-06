package com.tap.dao;

import java.util.List;
import com.tap.model.Address;

public interface AddressDAO {
    int addAddress(Address address);
    boolean updateAddress(Address address);
    boolean deleteAddress(int addressId, int userId);
    Address getAddressById(int addressId);
    List<Address> getAddressesByUserId(int userId);
    Address getDefaultAddress(int userId);
    boolean setDefaultAddress(int addressId, int userId);
}
