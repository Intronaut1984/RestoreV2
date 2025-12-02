import { FormGroup, FormControlLabel, Checkbox } from "@mui/material";
import { useEffect, useState } from "react";

type Item = string | { value: string; label: string };

type Props = {
    items: Item[];
    checked: string[];
    onChange: (items: string[]) => void;
}

export default function CheckboxButtons({items, checked, onChange}: Props) {
    const [checkedItems, setCheckedItems] = useState(checked);

    useEffect(() => {
        setCheckedItems(checked);
    }, [checked]);

    const handleToggle = (value: string) => {
        const updatedChecked = checkedItems?.includes(value)
            ? checkedItems.filter(item => item !== value)
            : [...checkedItems, value];

        setCheckedItems(updatedChecked);
        onChange(updatedChecked);
    }

    return (
        <FormGroup>
            {items.map((item) => {
                const value = typeof item === 'string' ? item : item.value;
                const label = typeof item === 'string' ? item : item.label;
                return (
                    <FormControlLabel
                        key={value}
                        control={<Checkbox 
                            checked={checkedItems.includes(value)}
                            onClick={() => handleToggle(value)}
                            color='secondary' 
                            sx={{ py: 0.7, fontSize: 40 }} 
                        />}
                        label={label}
                    />
                )
            })}
        </FormGroup>
    )
}